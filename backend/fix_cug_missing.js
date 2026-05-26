/**
 * Fixes the 242 missing CUG records:
 *  - 236 whose EMPNO is not in employees table → create employee from CUG data, then insert cug_contact
 *  - 6 who have no CELLNO → insert cug_contact with cellno = NULL
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX  = require('xlsx');
const path  = require('path');

function clean(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === 'null' || s === 'NULL' ? null : s;
}

function toDateFromNum(val) {
  if (!val) return null;
  if (typeof val === 'number' && val > 19000000 && val < 21000000) {
    const s = String(val);
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }
  if (typeof val === 'string') {
    const s = val.trim();
    const m = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  return null;
}

function categoryFromPayunit(payunit) {
  if (!payunit) return 'Non-Supervisory';
  const s = String(payunit).trim();
  if (s.length >= 3 && /[A-Za-z]/.test(s[2])) return 'Supervisory';
  return 'Non-Supervisory';
}

function shopFromPayunit(payunit) {
  if (!payunit) return null;
  const s = String(payunit).trim();
  const m = s.match(/^(\d{2})/);
  return m ? m[1] : (s.length >= 2 ? s.slice(0, 2) : s);
}

(async () => {
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'icf_hmis',
  });

  console.log('=== Fixing 242 missing CUG records ===\n');

  // Load Excel
  const wb   = XLSX.readFile(path.join(__dirname, 'CUG.xlsx'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
  console.log(`Excel rows: ${rows.length}`);

  // Build empno → EMISCARDNUMBER map from DB
  const [empnoRows] = await c.execute('SELECT EMISCARDNUMBER, empno FROM employees WHERE empno IS NOT NULL');
  const empnoMap = {};
  for (const r of empnoRows) empnoMap[String(r.empno)] = r.EMISCARDNUMBER;

  let empCreated = 0;
  let cugInserted = 0;
  let alreadyExists = 0;

  for (const r of rows) {
    const empno   = clean(r['EMPNO']);
    const cellno  = clean(r['CELLNO']);
    const name    = clean(r['NAME'])    || 'UNKNOWN';
    const desig   = clean(r['DESIG']);
    const dept    = clean(r['DEPTS'])   || 'General';
    const payunit = clean(r['PAYUNIT']);
    const sfRaw   = clean(r['SF']);
    const sfCode  = (sfRaw === 'Fur' || sfRaw === 'Shell') ? sfRaw : null;
    const age     = r['AGE'] ? parseInt(r['AGE']) : null;
    const sex     = clean(r['SEX']);
    const gender  = (sex === 'F' || sex === 'FEMALE') ? 'Female' : 'Male';
    const dob     = toDateFromNum(r['DOB']);
    const doa     = toDateFromNum(r['DOA']);
    const cat     = categoryFromPayunit(payunit);
    const shopCode = shopFromPayunit(payunit) || 'ICF';

    if (!empno) continue; // completely empty row

    let emis = empnoMap[String(empno)];

    // If EMPNO not in employees, create the employee from CUG data
    if (!emis) {
      // Generate a synthetic EMIS using empno as identifier
      emis = `CUG${empno}`;

      // Ensure shop exists
      try {
        await c.execute(
          `INSERT IGNORE INTO shops (shop_code, shop_name, department) VALUES (?,?,?)`,
          [shopCode, `Shop ${shopCode}`, dept]
        );
      } catch(e) { /* skip */ }

      try {
        const [result] = await c.execute(
          `INSERT IGNORE INTO employees 
           (EMISCARDNUMBER, emp_name, designation, department, shop_code, category,
            payunit, sf_code, gender, date_of_birth, date_of_joining, age, empno, is_active)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
          [emis, name, desig, dept, shopCode, cat, payunit, sfCode, gender, dob, doa, age, empno]
        );
        if (result.affectedRows > 0) {
          empnoMap[String(empno)] = emis; // update map
          empCreated++;
        }
      } catch(e) {
        console.error(`  Failed to create employee EMPNO ${empno}:`, e.message);
        continue;
      }
    }

    // Now insert into cug_contacts (cellno may be null for the 6 no-cellno rows)
    try {
      const [result] = await c.execute(
        `INSERT IGNORE INTO cug_contacts
         (sse_name, EMISCARDNUMBER, cug_number, designation, shop_code, department, is_active)
         VALUES (?,?,?,?,?,?,1)`,
        [name, emis, cellno, desig, shopCode, dept]
      );
      if (result.affectedRows > 0) {
        cugInserted++;
      } else {
        alreadyExists++;
      }
    } catch(e) {
      console.error(`  Failed to insert CUG contact for EMPNO ${empno}:`, e.message);
    }
  }

  // Final counts
  const [f1] = await c.execute('SELECT COUNT(*) AS total FROM cug_contacts WHERE is_active = 1');
  const [f2] = await c.execute('SELECT COUNT(*) AS total FROM employees');

  console.log(`\n✅ Done.`);
  console.log(`   New employees created  : ${empCreated}`);
  console.log(`   New CUG rows inserted  : ${cugInserted}`);
  console.log(`   Already existed (skip) : ${alreadyExists}`);
  console.log(`\n   Total CUG contacts now : ${f1[0].total}`);
  console.log(`   Total employees now    : ${f2[0].total}`);

  await c.end();
})().catch(e => console.error('Error:', e.message));
