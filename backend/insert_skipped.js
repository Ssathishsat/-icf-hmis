/**
 * Inserts the 6 skipped sick records from hosp_sick-26-05-14.xls
 * These rows had EMIS in __EMPTY_2 instead of __EMPTY_3.
 * Missing fields are stored as NULL.
 */
require('dotenv').config();
const XLSX  = require('xlsx');
const mysql = require('mysql2/promise');
const path  = require('path');

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) { if (isNaN(val)) return null; return val.toISOString().split('T')[0]; }
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(d)) return null;
    return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;
    const m1 = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
    const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  return null;
}

function clean(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === 'null' || s === 'NULL' ? null : s;
}

function categoryFromPayunit(payunit) {
  if (!payunit) return 'Non-Supervisory';
  const s = String(payunit).trim();
  if (s.length >= 3 && /[A-Za-z]/.test(s[2])) return 'Supervisory';
  return 'Non-Supervisory';
}

(async () => {
  const wb      = XLSX.readFile(path.join(__dirname, 'hosp_sick-26-05-14.xls'));
  const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
  const rows    = rawRows.slice(1);

  // Collect skipped rows: EMIS null in __EMPTY_3 but present in __EMPTY_2, and has a sick date
  const skipped = rows.filter(r => {
    const emis3    = clean(r['__EMPTY_3']);
    const emis2    = clean(r['__EMPTY_2']);
    const sickFrom = toDate(r['__EMPTY_9']);
    return !emis3 && emis2 && sickFrom;
  });

  console.log(`Found ${skipped.length} skipped rows to insert\n`);

  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'icf_hmis_2024',
    database: process.env.DB_NAME     || 'icf_hmis',
  });

  const [existingEmis] = await c.execute('SELECT EMISCARDNUMBER FROM employees');
  const validEmis = new Set(existingEmis.map(r => String(r.EMISCARDNUMBER).trim()));

  let inserted = 0;
  let empCreated = 0;

  for (const r of skipped) {
    const emis     = clean(r['__EMPTY_2']);   // UMID from col 2
    const empName  = clean(r['__EMPTY_4']) || 'UNKNOWN';
    const desig    = clean(r['__EMPTY_5']);   // may be null
    const dept     = clean(r['__EMPTY_6']) || 'General';
    const payunit  = clean(r['__EMPTY_7']);   // may be null
    const empCat   = clean(r['__EMPTY_8']);   // category text
    const sickFrom = toDate(r['__EMPTY_9']);
    const sickTo   = toDate(r['__EMPTY_10']);
    const sickType = clean(r['__EMPTY_11']) || 'General Illness';
    const rawDays  = r['__EMPTY_12'];
    let days = parseInt(rawDays) || 0;
    if (days === 0 && sickFrom && sickTo) {
      days = Math.max(0, Math.round((new Date(sickTo) - new Date(sickFrom)) / 86400000));
    }

    const status = sickTo ? 'Fit' : 'Sick';
    const cat    = empCat
      ? (empCat.includes('Supy') || empCat.toLowerCase().includes('supervisory') ? 'Supervisory' : 'Non-Supervisory')
      : categoryFromPayunit(payunit);

    // Create employee record if not already in DB
    if (!validEmis.has(emis)) {
      try {
        await c.execute(
          `INSERT IGNORE INTO employees 
           (EMISCARDNUMBER, emp_name, designation, department, shop_code, category, payunit, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [emis, empName, desig, dept, 'ICF', cat, payunit]
        );
        validEmis.add(emis);
        empCreated++;
        console.log(`  Created employee: ${emis} - ${empName}`);
      } catch (e) {
        console.error(`  Failed to create employee ${emis}:`, e.message);
        continue;
      }
    }

    // Compute week/month/year
    const d        = new Date(sickFrom);
    const weekNum  = Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
    const monthNum = d.getMonth() + 1;
    const yearNum  = d.getFullYear();

    try {
      await c.execute(
        `INSERT IGNORE INTO sick_fit_records
         (EMISCARDNUMBER, status, sick_date, fit_date, days_count, diagnosis,
          reporting_doctor, hospital_name, week_number, month_number, year_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [emis, status, sickFrom, sickTo, days, sickType,
         null, 'ICF Hospital', weekNum, monthNum, yearNum]
      );
      inserted++;
      console.log(`  Inserted sick record: ${emis} | ${empName} | ${sickFrom} → ${sickTo || 'NULL'} | ${days} days | ${sickType}`);
    } catch (e) {
      console.error(`  Failed to insert sick record for ${emis}:`, e.message);
    }
  }

  // Final count
  const [r1] = await c.execute('SELECT COUNT(DISTINCT EMISCARDNUMBER) AS total FROM sick_fit_records');
  console.log(`\n✅ Done. Inserted ${inserted} sick records, created ${empCreated} new employees.`);
  console.log(`   Total distinct employees with sick records: ${r1[0].total}`);

  await c.end();
})().catch(e => console.error('Error:', e.message));
