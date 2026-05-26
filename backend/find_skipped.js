/**
 * Identifies the 6 skipped rows from hosp_sick-26-05-14.xls
 * and shows what data they have / what's missing.
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

(async () => {
  const wb      = XLSX.readFile(path.join(__dirname, 'hosp_sick-26-05-14.xls'));
  const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
  const rows    = rawRows.slice(1); // skip header row

  console.log(`Total rows in Excel (after header): ${rows.length}\n`);

  // Print column keys from first row
  console.log('Column keys:', Object.keys(rows[0]), '\n');

  const skipped = [];
  const inserted = [];

  for (let i = 0; i < rows.length; i++) {
    const r      = rows[i];
    const emis   = clean(r['__EMPTY_3']);
    const sickFrom = toDate(r['__EMPTY_9']);

    if (!emis || !sickFrom) {
      skipped.push({ rowIndex: i + 2, raw: r, emis, sickFrom }); // +2 because slice(1) + 1-based
    } else {
      inserted.push(emis);
    }
  }

  console.log(`Inserted: ${inserted.length}`);
  console.log(`Skipped:  ${skipped.length}\n`);

  console.log('=== SKIPPED ROWS ===');
  for (const s of skipped) {
    console.log(`\nRow ${s.rowIndex}:`);
    console.log('  EMIS (col __EMPTY_3)     :', s.emis);
    console.log('  SickFrom (col __EMPTY_9) :', s.sickFrom);
    console.log('  Raw data:');
    for (const [k, v] of Object.entries(s.raw)) {
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        console.log(`    ${k}: ${v}`);
      }
    }
  }

  // Also check DB for which EMIS from Excel are already in sick_fit_records
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'icf_hmis',
  });

  const [dbRows] = await c.execute('SELECT DISTINCT EMISCARDNUMBER FROM sick_fit_records');
  const dbEmis = new Set(dbRows.map(r => String(r.EMISCARDNUMBER).trim()));
  console.log(`\nDB has ${dbEmis.size} distinct EMIS in sick_fit_records`);

  await c.end();
})().catch(e => console.error('Error:', e.message));
