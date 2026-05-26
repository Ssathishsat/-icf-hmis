require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX  = require('xlsx');
const path  = require('path');

function clean(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === 'null' || s === 'NULL' ? null : s;
}

(async () => {
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'icf_hmis',
  });

  // DB counts
  const [r1] = await c.execute('SELECT COUNT(*) AS total FROM cug_contacts');
  const [r2] = await c.execute('SELECT COUNT(*) AS total FROM cug_contacts WHERE is_active = 1');
  console.log('=== CUG DB Counts ===');
  console.log('Total rows in cug_contacts :', r1[0].total);
  console.log('Active (is_active=1)       :', r2[0].total);

  // Excel
  const wb   = XLSX.readFile(path.join(__dirname, 'CUG.xlsx'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
  console.log('\n=== CUG Excel Counts ===');
  console.log('Total rows in Excel        :', rows.length);
  console.log('Columns                    :', Object.keys(rows[0]));

  // Build empno → EMISCARDNUMBER map from DB
  const [empnoRows] = await c.execute('SELECT EMISCARDNUMBER, empno FROM employees WHERE empno IS NOT NULL');
  const empnoMap = {};
  for (const r of empnoRows) empnoMap[String(r.empno)] = r.EMISCARDNUMBER;

  let noEmpno   = 0;
  let noEmisMap = 0;
  let noCellno  = 0;
  let inserted  = 0;
  const skipSamples = [];

  for (const r of rows) {
    const empno  = clean(r['EMPNO']);
    const cellno = clean(r['CELLNO']);

    if (!empno) { noEmpno++; if (skipSamples.length < 3) skipSamples.push({ reason: 'no EMPNO', row: r }); continue; }

    const emis = empnoMap[String(empno)];
    if (!emis) { noEmisMap++; if (skipSamples.length < 6) skipSamples.push({ reason: `EMPNO ${empno} not in employees`, row: r }); continue; }

    if (!cellno) { noCellno++; continue; } // skipped in original loader (no cellno = not inserted to cug_contacts)

    inserted++;
  }

  console.log('\n=== Skip Breakdown ===');
  console.log('No EMPNO in row            :', noEmpno);
  console.log('EMPNO not found in employees:', noEmisMap);
  console.log('No CELLNO (skipped in loader):', noCellno);
  console.log('Would be inserted          :', inserted);
  console.log('Difference (8523 - inserted):', rows.length - inserted);

  console.log('\n=== Sample Skipped Rows ===');
  for (const s of skipSamples) {
    console.log(`Reason: ${s.reason}`);
    const relevant = {};
    for (const [k,v] of Object.entries(s.row)) {
      if (v !== null && v !== undefined && String(v).trim() !== '') relevant[k] = v;
    }
    console.log('  Data:', JSON.stringify(relevant));
  }

  await c.end();
})().catch(e => console.error('Error:', e.message));
