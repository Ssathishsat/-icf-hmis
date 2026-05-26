/**
 * ICF HMIS - Complete Real Data Loader
 * Loads all 4 Excel files into the database
 * EMISCARDNUMBER (UMID_CARDNO) is the primary key across all tables
 * 
 * PAYUNIT rules:
 *   - First 2 chars = shop number
 *   - 3rd char = alphabet → Supervisory, digit → Non-Supervisory
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

const BASE = __dirname;

// ── Excel serial date → MySQL date string ────────────────────
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val)) return null;
    return val.toISOString().split('T')[0];
  }
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
    const m3 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m3) return `${m3[1]}-${m3[2]}-${m3[3]}`;
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  return null;
}

function toDateFromNum(val) {
  if (!val) return null;
  if (typeof val === 'number' && val > 19000000 && val < 21000000) {
    const s = String(val);
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }
  return toDate(val);
}

function clean(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === 'null' || s === 'NULL' ? null : s;
}

function gender(v) {
  const s = String(v || '').trim().toUpperCase();
  if (s === 'F' || s === 'FEMALE') return 'Female';
  return 'Male';
}

/**
 * Derive category from PAYUNIT:
 *   - 3rd character is an alphabet → Supervisory
 *   - 3rd character is a digit (or missing) → Non-Supervisory
 * e.g. "30A" → Supervisory, "304" → Non-Supervisory, "30" → Non-Supervisory
 */
function categoryFromPayunit(payunit) {
  if (!payunit) return 'Non-Supervisory';
  const s = String(payunit).trim();
  if (s.length >= 3) {
    const thirdChar = s[2];
    if (/[A-Za-z]/.test(thirdChar)) return 'Supervisory';
  }
  return 'Non-Supervisory';
}

/**
 * Extract shop code from PAYUNIT (first 2 characters/digits)
 * e.g. "30A" → "30", "304" → "30", "541" → "54"
 */
function shopFromPayunit(payunit) {
  if (!payunit) return null;
  const s = String(payunit).trim();
  // Take first 2 numeric chars
  const m = s.match(/^(\d{2})/);
  return m ? m[1] : (s.length >= 2 ? s.slice(0, 2) : s);
}

async function batchInsert(conn, table, cols, rows, size = 300) {
  let ins = 0, skip = 0;
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    const ph = batch.map(() => `(${cols.map(() => '?').join(',')})`).join(',');
    try {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO ${table} (${cols.join(',')}) VALUES ${ph}`,
        batch.flat()
      );
      ins  += r.affectedRows;
      skip += batch.length - r.affectedRows;
    } catch(e) {
      for (const row of batch) {
        try {
          await conn.execute(
            `INSERT IGNORE INTO ${table} (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`,
            row
          );
          ins++;
        } catch { skip++; }
      }
    }
    process.stdout.write(`\r   ${Math.min(i+size, rows.length)}/${rows.length} rows...`);
  }
  process.stdout.write('\n');
  return { ins, skip };
}

async function main() {
  console.log('\n🚂 ICF HMIS - Loading All Real Data');
  console.log('=====================================\n');

  const conn = await mysql.createConnection(DB);
  console.log('✅ MySQL connected\n');

  try {

    // ══════════════════════════════════════════════════════
    // STEP 1 — Ensure schema columns exist
    // ══════════════════════════════════════════════════════
    console.log('🔧 Ensuring schema columns exist...');
    const [existingCols] = await conn.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees'
    `, [DB.database]);
    const colNames = existingCols.map(c => c.COLUMN_NAME.toLowerCase());

    const columnsToAdd = [
      { name: 'empno',    type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'hrms_id',  type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'ipas_id',  type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'payunit',  type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'cell_no',  type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'age',      type: 'INT DEFAULT NULL' },
      { name: 'sf_code',  type: 'VARCHAR(20) DEFAULT NULL' },
    ];

    for (const col of columnsToAdd) {
      if (!colNames.includes(col.name.toLowerCase())) {
        console.log(`   Adding column ${col.name}...`);
        await conn.execute(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.type}`);
      }
    }
    console.log('   ✅ Schema ready\n');

    // ══════════════════════════════════════════════════════
    // STEP 2 — Clear old data
    // ══════════════════════════════════════════════════════
    console.log('🗑️  Clearing old seed data...');
    await conn.execute(`SET FOREIGN_KEY_CHECKS = 0`);
    await conn.execute(`DELETE FROM sick_fit_records`);
    await conn.execute(`DELETE FROM sse_assignments`);
    await conn.execute(`DELETE FROM cug_contacts`);
    await conn.execute(`DELETE FROM employees`);
    await conn.execute(`DELETE FROM shops`);
    await conn.execute(`SET FOREIGN_KEY_CHECKS = 1`);
    console.log('   ✅ Cleared\n');

    // ══════════════════════════════════════════════════════
    // STEP 3 — Load EMPNO_.xlsx (employee base data)
    // ══════════════════════════════════════════════════════
    console.log('📂 Loading EMPNO_.xlsx (employees)...');
    const empWb   = XLSX.readFile(path.join(BASE, 'EMPNO_.xlsx'));
    const empRows = XLSX.utils.sheet_to_json(empWb.Sheets[empWb.SheetNames[0]], { defval: null });
    console.log(`   ${empRows.length} rows found`);

    // Build a map of empno → row for later CUG merge
    const empnoToRow = {};
    const seenEmis   = new Set();
    const empData    = [];

    for (const r of empRows) {
      const emis   = clean(r['UMID_CARDNO']);
      const empno  = clean(r['EMPNO']);
      if (!emis || seenEmis.has(emis)) continue;
      seenEmis.add(emis);
      if (empno) empnoToRow[String(empno)] = r;

      const payunit  = clean(r['PAYUNIT']);
      const shopCode = shopFromPayunit(payunit);
      const cat      = categoryFromPayunit(payunit);
      const dob      = toDateFromNum(r['DOB']);
      const doa      = toDateFromNum(r['DOA']);

      // Department from EMPNO is a numeric code — will be overridden by CUG
      const deptMap = {
        '1':'Mechanical','2':'Electrical','3':'Civil','4':'Mechanical',
        '5':'Medical','6':'Stores','7':'Security','8':'Accounts','9':'Admin',
        '10':'Personnel','11':'Electrical','12':'Mechanical','13':'Civil',
      };
      const dept = deptMap[String(r['DEPT'] || '').trim()] || 'General';

      empData.push([
        emis,                           // EMISCARDNUMBER
        clean(r['NAME']) || 'UNKNOWN',  // emp_name
        clean(r['DESIG']),              // designation
        dept,                           // department (will be updated by CUG)
        shopCode,                       // shop_code (first 2 digits of PAYUNIT)
        cat,                            // category (from PAYUNIT 3rd char)
        clean(r['SCALECD']),            // grade
        doa,                            // date_of_joining
        dob,                            // date_of_birth
        gender(r['GENDER']),            // gender
        1,                              // is_active
        empno,                          // empno
        clean(r['HRMS_ID']),            // hrms_id
        clean(r['IPAS_ID']),            // ipas_id
        payunit,                        // payunit
        null,                           // cell_no
        null,                           // age
        null,                           // sf_code
      ]);
    }

    // ── Seed shops from PAYUNIT shop codes first ──────────
    console.log('🏭 Creating shops from PAYUNIT data...');
    const uniqueShops = new Set(empData.map(e => e[4]).filter(Boolean));
    for (const shopCode of uniqueShops) {
      try {
        await conn.execute(
          `INSERT IGNORE INTO shops (shop_code, shop_name, department, division, location) VALUES (?,?,?,?,?)`,
          [shopCode, `Shop ${shopCode}`, 'General', 'ICF', 'ICF Chennai']
        );
      } catch(e) { /* skip */ }
    }
    console.log(`   ✅ ${uniqueShops.size} shops created\n`);

    console.log(`   Inserting ${empData.length} employees...`);
    const empResult = await batchInsert(conn, 'employees',
      ['EMISCARDNUMBER','emp_name','designation','department','shop_code','category',
       'grade','date_of_joining','date_of_birth','gender','is_active',
       'empno','hrms_id','ipas_id','payunit','cell_no','age','sf_code'],
      empData
    );
    console.log(`   ✅ Employees: ${empResult.ins} inserted, ${empResult.skip} skipped\n`);

    // ══════════════════════════════════════════════════════
    // STEP 4 — Load CUG.xlsx (update dept, category, SF, cell)
    // ══════════════════════════════════════════════════════
    console.log('📂 Loading CUG.xlsx (updating dept from CUG, SF, cell_no, category)...');
    const cugWb   = XLSX.readFile(path.join(BASE, 'CUG.xlsx'));
    const cugRows = XLSX.utils.sheet_to_json(cugWb.Sheets[cugWb.SheetNames[0]], { defval: null });
    console.log(`   ${cugRows.length} rows found`);

    // Build empno → EMISCARDNUMBER map from DB
    const [empnoRows] = await conn.execute(`SELECT EMISCARDNUMBER, empno FROM employees WHERE empno IS NOT NULL`);
    const empnoMap = {};
    for (const r of empnoRows) empnoMap[String(r.empno)] = r.EMISCARDNUMBER;

    const cugContacts = [];
    let catUpdated = 0;

    for (const r of cugRows) {
      const empno   = clean(r['EMPNO']);
      const cellno  = clean(r['CELLNO']);
      const desig   = clean(r['DESIG']);
      const name    = clean(r['NAME']);
      const payunit = clean(r['PAYUNIT']);
      // CUG DEPTS column is the canonical text department
      const dept    = clean(r['DEPTS']) || 'General';
      const sfRaw   = clean(r['SF']);
      // Only accept Fur or Shell; treat '?' or other as null
      const sfCode  = (sfRaw === 'Fur' || sfRaw === 'Shell') ? sfRaw : null;
      const age     = r['AGE'] ? parseInt(r['AGE']) : null;
      const sex     = clean(r['SEX']);
      const empGender = (sex === 'F' || sex === 'FEMALE') ? 'Female' : 'Male';

      // Category from PAYUNIT (authoritative)
      const cat = categoryFromPayunit(payunit);
      const shopCode = shopFromPayunit(payunit);

      const emis = empno ? empnoMap[String(empno)] : null;

      if (emis) {
        try {
          // Update department from CUG (canonical), SF code, cell_no, age, gender, category
          await conn.execute(
            `UPDATE employees 
             SET department=?, category=?, cell_no=?, age=?, sf_code=?, gender=?
             WHERE EMISCARDNUMBER=?`,
            [dept, cat, cellno, age, sfCode, empGender, emis]
          );
          catUpdated++;
        } catch(e) { /* skip */ }

        // Update shop name now we know the department
        if (shopCode) {
          try {
            await conn.execute(
              `UPDATE shops SET department=?, shop_name=COALESCE(NULLIF(shop_name,'Shop ${shopCode}'), shop_name) WHERE shop_code=?`,
              [dept, shopCode]
            );
          } catch(e) { /* skip */ }
        }

        if (cellno) {
          cugContacts.push([
            name || 'UNKNOWN',
            emis,
            cellno,
            desig,
            shopCode,
            dept,
            1,
          ]);
        }
      }
    }

    console.log(`   ✅ Updated ${catUpdated} employees from CUG\n`);

    // Insert CUG contacts
    if (cugContacts.length > 0) {
      console.log(`   Inserting ${cugContacts.length} CUG contacts...`);
      // Ensure any new shop codes from CUG exist
      const cugShops = new Set(cugContacts.map(c => c[4]).filter(Boolean));
      for (const sc of cugShops) {
        await conn.execute(
          `INSERT IGNORE INTO shops (shop_code, shop_name) VALUES (?,?)`,
          [sc, `Shop ${sc}`]
        );
      }
      const cugResult = await batchInsert(conn, 'cug_contacts',
        ['sse_name','EMISCARDNUMBER','cug_number','designation','shop_code','department','is_active'],
        cugContacts
      );
      console.log(`   ✅ CUG contacts: ${cugResult.ins} inserted, ${cugResult.skip} skipped\n`);
    }

    // ══════════════════════════════════════════════════════
    // STEP 5 — Load hosp_sick-26-05-14.xls (sick records)
    // ══════════════════════════════════════════════════════
    console.log('📂 Loading hosp_sick-26-05-14.xls (sick/fit records)...');
    const sickWb   = XLSX.readFile(path.join(BASE, 'hosp_sick-26-05-14.xls'));
    const sickRaw  = XLSX.utils.sheet_to_json(sickWb.Sheets[sickWb.SheetNames[0]], { defval: null });
    const sickRows = sickRaw.slice(1);
    console.log(`   ${sickRows.length} sick records found`);

    const [allEmis] = await conn.execute(`SELECT EMISCARDNUMBER FROM employees`);
    const validEmis = new Set(allEmis.map(r => String(r.EMISCARDNUMBER).trim()));

    const sickData = [];
    let sickSkipped = 0;

    for (const r of sickRows) {
      const emis     = clean(r['__EMPTY_3']);
      const sickFrom = toDate(r['__EMPTY_9']);
      if (!emis || !sickFrom) { sickSkipped++; continue; }

      const sickTo  = toDate(r['__EMPTY_10']);
      const rawDays = r['__EMPTY_12'];
      let days = parseInt(rawDays) || 0;
      if (days === 0 && sickFrom && sickTo) {
        days = Math.max(0, Math.round((new Date(sickTo) - new Date(sickFrom)) / 86400000));
      }

      const sickType = clean(r['__EMPTY_11']) || 'General Illness';
      const empName  = clean(r['__EMPTY_4'])  || 'UNKNOWN';
      const desig    = clean(r['__EMPTY_5']);
      const dept     = clean(r['__EMPTY_6'])  || 'General';
      const empCat   = clean(r['__EMPTY_8'])  || 'Non-Supervisory';
      const status   = sickTo ? 'Fit' : 'Sick';

      if (!validEmis.has(emis)) {
        const cat = empCat.includes('Supy') || empCat.includes('Supervisory') ? 'Supervisory' : 'Non-Supervisory';
        try {
          await conn.execute(
            `INSERT IGNORE INTO shops (shop_code, shop_name, department) VALUES (?,?,?)`,
            ['ICF', 'ICF General', dept]
          );
          await conn.execute(
            `INSERT IGNORE INTO employees (EMISCARDNUMBER,emp_name,designation,department,shop_code,category,is_active) VALUES (?,?,?,?,?,?,1)`,
            [emis, empName, desig, dept, 'ICF', cat]
          );
          validEmis.add(emis);
        } catch(e) { sickSkipped++; continue; }
      }

      const d = new Date(sickFrom);
      const weekNum  = Math.ceil((((d - new Date(d.getFullYear(),0,1))/86400000) + new Date(d.getFullYear(),0,1).getDay()+1)/7);
      const monthNum = d.getMonth() + 1;
      const yearNum  = d.getFullYear();

      sickData.push([
        emis, status, sickFrom, sickTo, days,
        sickType, null, 'ICF Hospital',
        weekNum, monthNum, yearNum
      ]);
    }

    console.log(`   Inserting ${sickData.length} sick records (${sickSkipped} skipped)...`);
    const sickResult = await batchInsert(conn, 'sick_fit_records',
      ['EMISCARDNUMBER','status','sick_date','fit_date','days_count','diagnosis',
       'reporting_doctor','hospital_name','week_number','month_number','year_number'],
      sickData
    );
    console.log(`   ✅ Sick records: ${sickResult.ins} inserted, ${sickResult.skip} skipped\n`);

    // ══════════════════════════════════════════════════════
    // STEP 6 — Seed admin users
    // ══════════════════════════════════════════════════════
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Admin@123', 10);
    const users = [
      ['admin', hash, 'System Administrator', 'admin@icf.railnet.gov.in', 'Admin', null],
      ['pcmo',  hash, 'Principal Chief Medical Officer', 'pcmo@icf.railnet.gov.in', 'Admin', null],
    ];
    for (const u of users) {
      const shopVal = u[5] ? `'${u[5]}'` : 'NULL';
      try {
        await conn.execute(
          `INSERT IGNORE INTO users (username,password_hash,full_name,email,role,shop_code) VALUES (?,?,?,?,?,${shopVal})`,
          u.slice(0,5)
        );
      } catch(e) { /* skip */ }
    }

    // ══════════════════════════════════════════════════════
    // STEP 7 — Final counts
    // ══════════════════════════════════════════════════════
    console.log('📊 Final Database Counts:');
    const tables = ['shops','employees','sick_fit_records','cug_contacts','users'];
    for (const t of tables) {
      const [r] = await conn.execute(`SELECT COUNT(*) AS cnt FROM ${t}`);
      console.log(`   ${t.padEnd(22)} → ${String(r[0].cnt).padStart(6)} rows`);
    }

    const [cats] = await conn.execute(`SELECT category, COUNT(*) AS cnt FROM employees GROUP BY category`);
    console.log('\n   Employee Categories:');
    for (const c of cats) console.log(`   ${c.category.padEnd(20)} → ${c.cnt}`);

    const [sfs] = await conn.execute(`SELECT sf_code, COUNT(*) AS cnt FROM employees WHERE sf_code IS NOT NULL GROUP BY sf_code`);
    console.log('\n   Fur/Shell breakdown:');
    for (const s of sfs) console.log(`   ${String(s.sf_code).padEnd(20)} → ${s.cnt}`);

    const [genders] = await conn.execute(`SELECT gender, COUNT(*) AS cnt FROM employees GROUP BY gender`);
    console.log('\n   Gender breakdown:');
    for (const g of genders) console.log(`   ${String(g.gender).padEnd(20)} → ${g.cnt}`);

    const [statuses] = await conn.execute(`SELECT status, COUNT(*) AS cnt FROM sick_fit_records GROUP BY status`);
    console.log('\n   Sick/Fit Records:');
    for (const s of statuses) console.log(`   ${s.status.padEnd(20)} → ${s.cnt}`);

    console.log('\n=====================================');
    console.log('✅  ALL REAL DATA LOADED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('\nLogin: admin / Admin@123');
    console.log('Open:  http://localhost:3000\n');

  } finally {
    await conn.end();
  }
}

main().catch(e => {
  console.error('\n❌ Error:', e.message);
  console.error(e.stack);
  process.exit(1);
});
