/**
 * Cleanly reloads all CUG contacts from CUG.xlsx
 * - Clears the cug_contacts table first
 * - Creates missing employees (CUG-only staff) with prefix CUG<empno>
 * - Inserts all 8523 rows (cellno=NULL for the 6 with no phone)
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

async function batchInsert(conn, table, cols, rows, size = 500) {
  let ins = 0;
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    const ph = batch.map(() => `(${cols.map(() => '?').join(',')})`).join(',');
    try {
      const [r] = await conn.execute(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES ${ph}`,
        batch.flat()
      );
      ins += r.affectedRows;
    } catch(e) {
      // fallback row by row
      for (const row of batch) {
        try {
          await conn.execute(
            `INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`,
            row
          );
          ins++;
        } catch { /* skip */ }
      }
    }
    process.stdout.write(`\r   ${Math.min(i+size, rows.length)}/${rows.length} rows...`);
  }
  process.stdout.write('\n');
  return ins;
}

(async () => {
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'icf_hmis',
  });

  console.log('=== Reloading CUG contacts cleanly ===\n');

  // Step 1: Clear cug_contacts
  await c.execute('SET FOREIGN_KEY_CHECKS = 0');
  await c.execute('DELETE FROM cug_contacts');
  await c.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ Cleared cug_contacts table');

  // Step 2: Load Excel
  const wb   = XLSX.readFile(path.join(__dirname, 'CUG.xlsx'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
  console.log(`   Excel rows: ${rows.length}`);

  // Step 3: Build empno → EMISCARDNUMBER map from DB
  const [empnoRows] = await c.execute('SELECT EMISCARDNUMBER, empno FROM employees WHERE empno IS NOT NULL');
  const empnoMap = {};
  for (const r of empnoRows) empnoMap[String(r.empno)] = r.EMISCARDNUMBER;
  console.log(`   Employees in DB: ${empnoRows.length}`);

  // Step 4: Create missing employees from CUG data
  console.log('\n📋 Creating missing employees from CUG...');
  let empCreated = 0;

  for (const r of rows) {
    const empno = clean(r['EMPNO']);
    if (!empno || empnoMap[String(empno)]) continue; // skip if no empno or already exists

    const name     = clean(r['NAME'])    || 'UNKNOWN';
    const desig    = clean(r['DESIG']);
    const dept     = clean(r['DEPTS'])   || 'General';
    const payunit  = clean(r['PAYUNIT']);
    const sfRaw    = clean(r['SF']);
    const sfCode   = (sfRaw === 'Fur' || sfRaw === 'Shell') ? sfRaw : null;
    const age      = r['AGE'] ? parseInt(r['AGE']) : null;
    const sex      = clean(r['SEX']);
    const gender   = (sex === 'F' || sex === 'FEMALE') ? 'Female' : 'Male';
    const dob      = toDateFromNum(r['DOB']);
    const doa      = toDateFromNum(r['DOA']);
    const cat      = categoryFromPayunit(payunit);
    const shopCode = shopFromPayunit(payunit) || 'ICF';
    const emis     = `CUG${empno}`;

    // Ensure shop exists
    try {
      await c.execute(
        `INSERT IGNORE INTO shops (shop_code, shop_name, department) VALUES (?,?,?)`,
        [shopCode, `Shop ${shopCode}`, dept]
      );
    } catch(e) { /* skip */ }

    try {
      await c.execute(
        `INSERT IGNORE INTO employees 
         (EMISCARDNUMBER, emp_name, designation, department, shop_code, category,
          payunit, sf_code, gender, date_of_birth, date_of_joining, age, empno, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
        [emis, name, desig, dept, shopCode, cat, payunit, sfCode, gender, dob, doa, age, empno]
      );
      empnoMap[String(empno)] = emis;
      empCreated++;
    } catch(e) {
      console.error(`  Failed to create employee EMPNO ${empno}:`, e.message);
    }
  }
  console.log(`   ✅ Created ${empCreated} new employees from CUG\n`);

  // Step 5: Build cug_contacts rows
  console.log('📋 Inserting all CUG contacts...');
  const cugData = [];

  for (const r of rows) {
    const empno    = clean(r['EMPNO']);
    const cellno   = clean(r['CELLNO']);
    const name     = clean(r['NAME'])    || 'UNKNOWN';
    const desig    = clean(r['DESIG']);
    const dept     = clean(r['DEPTS'])   || 'General';
    const payunit  = clean(r['PAYUNIT']);
    const shopCode = shopFromPayunit(payunit) || 'ICF';

    if (!empno) continue;

    const emis = empnoMap[String(empno)];
    if (!emis) continue; // still not found (shouldn't happen after step 4)

    cugData.push([name, emis, cellno, desig, shopCode, dept, 1]);
  }

  const inserted = await batchInsert(c, 'cug_contacts',
    ['sse_name', 'EMISCARDNUMBER', 'cug_number', 'designation', 'shop_code', 'department', 'is_active'],
    cugData
  );

  // Final counts
  const [f1] = await c.execute('SELECT COUNT(*) AS total FROM cug_contacts WHERE is_active = 1');
  const [f2] = await c.execute('SELECT COUNT(*) AS total FROM employees');

  console.log(`\n✅ Done.`);
  console.log(`   New employees created   : ${empCreated}`);
  console.log(`   CUG contacts inserted   : ${inserted}`);
  console.log(`   Total CUG contacts now  : ${f1[0].total}  (should be 8523)`);
  console.log(`   Total employees now     : ${f2[0].total}`);

  await c.end();
})().catch(e => console.error('Error:', e.message));
