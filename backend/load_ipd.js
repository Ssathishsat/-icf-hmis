/**
 * ICF HMIS - IPD Data Loader
 * Loads ipd.xls → ipd_records table
 * Filters rows where Category/ID ends with 'A' (Employees only)
 * Maps UMID from Category/ID to employees table
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX  = require('xlsx');
const path  = require('path');

const DB = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME     || 'icf_hmis',
  timezone: '+05:30',
};

// Parse "14-05-26 /19:32" or Excel serial number → DATE string
function parseAdmissionDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const s = val.trim();
    // "14-05-26 /19:32" → DD-MM-YY
    const m1 = s.match(/^(\d{2})-(\d{2})-(\d{2})/);
    if (m1) return `20${m1[3]}-${m1[2]}-${m1[1]}`;
    // "14-05-2026"
    const m2 = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  }
  return null;
}

function parseAdmissionTime(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel serial — extract time portion
    const totalSecs = Math.round((val % 1) * 86400);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  if (typeof val === 'string') {
    const m = val.match(/(\d{2}:\d{2})/);
    return m ? m[1] : null;
  }
  return null;
}

function clean(v) {
  if (v === null || v === undefined) return null;
  // Remove HTML entities and extra spaces
  return String(v).replace(/&#xa0;/g, ' ').replace(/&amp;/g, '&').trim() || null;
}

async function main() {
  console.log('\n🏥 ICF HMIS - IPD Data Loader');
  console.log('================================\n');

  const conn = await mysql.createConnection(DB);
  console.log('✅ MySQL connected\n');

  try {
    // Read IPD Excel
    const wb   = XLSX.readFile(path.join(__dirname, 'ipd.xls'));
    const ws   = wb.Sheets['Sheet2'];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null, header: 1 });

    // Filter only actual data rows (first column is a number = Sl No)
    const dataRows = rows.filter(r => r[0] && typeof r[0] === 'number');
    console.log(`📂 Total rows in IPD file : ${dataRows.length}`);

    // Filter rows where Category/ID ends with 'A' (Employees)
    const employeeRows = dataRows.filter(r => {
      const catId = clean(r[4]) || '';
      const umid  = catId.split('/').pop().trim();
      return umid.toUpperCase().endsWith('A');
    });
    console.log(`👤 Rows ending with 'A'   : ${employeeRows.length}`);

    // Get all valid EMISCARDNUMBERs from DB
    const [dbEmis] = await conn.execute(`SELECT EMISCARDNUMBER FROM employees`);
    const validEmis = new Set(dbEmis.map(r => String(r.EMISCARDNUMBER).trim()));
    console.log(`🗄️  Employees in DB        : ${validEmis.size}\n`);

    // Clear existing IPD records
    await conn.execute(`DELETE FROM ipd_records`);
    console.log('🗑️  Cleared old IPD records\n');

    let inserted = 0, skipped = 0, noMatch = 0;
    const ipdData = [];

    for (const r of employeeRows) {
      const catIdRaw = clean(r[4]) || '';
      // Extract UMID: part after last '/'
      const umidRaw  = catIdRaw.split('/').pop().trim();
      // Remove trailing 'A' to get the base UMID
      const umid     = umidRaw.replace(/A$/i, '').trim();

      // Try to match with employees table
      // The UMID in IPD may or may not have the trailing A in the DB
      let emis = null;
      if (validEmis.has(umidRaw))  emis = umidRaw;   // full match with A
      else if (validEmis.has(umid)) emis = umid;      // match without A

      const admDate = parseAdmissionDate(r[8]);
      const admTime = parseAdmissionTime(r[8]);
      const mobile  = r[6] ? String(r[6]).replace(/\D/g,'').slice(-10) : null;

      ipdData.push([
        r[0],                    // sl_no
        clean(r[1]),             // cr_no
        clean(r[2]),             // admission_no
        clean(r[3]),             // patient_name
        catIdRaw,                // category_id (full original)
        emis,                    // EMISCARDNUMBER (matched or null)
        clean(r[5]),             // age_sex
        mobile,                  // mobile
        clean(r[7]),             // dept_ward
        admDate,                 // admission_date
        admTime,                 // admission_time
        clean(r[9]),             // acceptance_status
        clean(r[10]),            // consultant
        clean(r[11]),            // operator
      ]);

      if (!emis) noMatch++;
    }

    // Batch insert
    for (const row of ipdData) {
      try {
        await conn.execute(
          `INSERT INTO ipd_records 
           (sl_no, cr_no, admission_no, patient_name, category_id, EMISCARDNUMBER,
            age_sex, mobile, dept_ward, admission_date, admission_time,
            acceptance_status, consultant, operator)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          row
        );
        inserted++;
      } catch(e) {
        skipped++;
      }
    }

    console.log(`✅ IPD Records inserted : ${inserted}`);
    console.log(`⚠️  Skipped (errors)    : ${skipped}`);
    console.log(`🔍 No employee match   : ${noMatch} (stored with NULL EMISCARDNUMBER)\n`);

    // Summary
    const [[{ total }]] = await conn.execute(`SELECT COUNT(*) as total FROM ipd_records`);
    const [[{ matched }]] = await conn.execute(`SELECT COUNT(*) as matched FROM ipd_records WHERE EMISCARDNUMBER IS NOT NULL`);
    const [[{ unmatched }]] = await conn.execute(`SELECT COUNT(*) as unmatched FROM ipd_records WHERE EMISCARDNUMBER IS NULL`);

    console.log('📊 IPD Summary:');
    console.log(`   Total IPD records    : ${total}`);
    console.log(`   Matched to employees : ${matched}`);
    console.log(`   Unmatched            : ${unmatched}`);

    // Show sample matched records
    const [samples] = await conn.execute(`
      SELECT i.patient_name, i.category_id, i.EMISCARDNUMBER,
             e.emp_name, e.designation, e.department, e.category,
             i.dept_ward, i.admission_date
      FROM ipd_records i
      JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
      LIMIT 5
    `);
    if (samples.length > 0) {
      console.log('\n📋 Sample Matched Records:');
      samples.forEach(s => {
        console.log(`   ${s.patient_name} → ${s.emp_name} | ${s.designation} | ${s.department} | ${s.admission_date}`);
      });
    }

    console.log('\n================================');
    console.log('✅ IPD DATA LOADED SUCCESSFULLY!');
    console.log('================================\n');

  } finally {
    await conn.end();
  }
}

main().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
