/**
 * ICF HMIS - Full Database Setup Script
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
  timezone: '+05:30',
};

async function run(conn, sql, label) {
  try {
    await conn.query(sql);
    process.stdout.write('.');
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_ENTRY' ||
      e.message.includes('already exists') || e.message.includes('Duplicate entry')) {
      process.stdout.write('s');
    } else {
      process.stdout.write('!');
      // console.warn('\n  WARN:', e.message.substring(0,100));
    }
  }
}

async function setup() {
  let conn;
  try {
    console.log('\n🚂 ICF HMIS - Full Database Setup');
    console.log('=====================================');

    conn = await mysql.createConnection({ ...config, database: undefined });
    console.log('✅ MySQL connected!');

    await conn.query(`CREATE DATABASE IF NOT EXISTS icf_hmis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE icf_hmis`);
    console.log('✅ Database icf_hmis ready\n');

    // ── CREATE TABLES ──────────────────────────────────────
    console.log('📋 Creating tables...');

    await run(conn, `CREATE TABLE IF NOT EXISTS shops (
      shop_id    INT AUTO_INCREMENT PRIMARY KEY,
      shop_code  VARCHAR(20) NOT NULL UNIQUE,
      shop_name  VARCHAR(100) NOT NULL,
      department VARCHAR(100),
      division   VARCHAR(50),
      location   VARCHAR(100),
      is_active  TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shop_code (shop_code)
    ) ENGINE=InnoDB`);

    await run(conn, `CREATE TABLE IF NOT EXISTS employees (
      EMISCARDNUMBER  VARCHAR(20) PRIMARY KEY,
      emp_name        VARCHAR(150) NOT NULL,
      designation     VARCHAR(100),
      department      VARCHAR(100),
      shop_code       VARCHAR(20),
      category        ENUM('Supervisory','Non-Supervisory') DEFAULT 'Non-Supervisory',
      grade           VARCHAR(20),
      date_of_joining DATE,
      date_of_birth   DATE,
      gender          ENUM('Male','Female','Other') DEFAULT 'Male',
      is_active       TINYINT(1) DEFAULT 1,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_code) REFERENCES shops(shop_code) ON DELETE SET NULL ON UPDATE CASCADE,
      INDEX idx_shop_code (shop_code),
      INDEX idx_department (department),
      INDEX idx_category (category)
    ) ENGINE=InnoDB`);

    await run(conn, `CREATE TABLE IF NOT EXISTS sick_fit_records (
      record_id        INT AUTO_INCREMENT PRIMARY KEY,
      EMISCARDNUMBER   VARCHAR(20) NOT NULL,
      status           ENUM('Sick','Fit') NOT NULL DEFAULT 'Sick',
      sick_date        DATE NOT NULL,
      fit_date         DATE,
      days_count       INT DEFAULT 0,
      diagnosis        VARCHAR(255),
      reporting_doctor VARCHAR(150),
      hospital_name    VARCHAR(150),
      remarks          TEXT,
      week_number      INT,
      month_number     INT,
      year_number      INT,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (EMISCARDNUMBER) REFERENCES employees(EMISCARDNUMBER) ON DELETE CASCADE ON UPDATE CASCADE,
      INDEX idx_emis (EMISCARDNUMBER),
      INDEX idx_status (status),
      INDEX idx_sick_date (sick_date)
    ) ENGINE=InnoDB`);

    await run(conn, `CREATE TABLE IF NOT EXISTS cug_contacts (
      contact_id     INT AUTO_INCREMENT PRIMARY KEY,
      sse_name       VARCHAR(150) NOT NULL,
      EMISCARDNUMBER VARCHAR(20),
      cug_number     VARCHAR(20) NOT NULL,
      designation    VARCHAR(100),
      shop_code      VARCHAR(20),
      department     VARCHAR(100),
      is_active      TINYINT(1) DEFAULT 1,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_code) REFERENCES shops(shop_code) ON DELETE SET NULL ON UPDATE CASCADE,
      INDEX idx_shop_code (shop_code)
    ) ENGINE=InnoDB`);

    await run(conn, `CREATE TABLE IF NOT EXISTS sse_assignments (
      assignment_id  INT AUTO_INCREMENT PRIMARY KEY,
      EMISCARDNUMBER VARCHAR(20) NOT NULL,
      shop_code      VARCHAR(20) NOT NULL,
      assigned_date  DATE NOT NULL,
      is_current     TINYINT(1) DEFAULT 1,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (EMISCARDNUMBER) REFERENCES employees(EMISCARDNUMBER) ON DELETE CASCADE,
      FOREIGN KEY (shop_code) REFERENCES shops(shop_code) ON DELETE CASCADE
    ) ENGINE=InnoDB`);

    await run(conn, `CREATE TABLE IF NOT EXISTS users (
      user_id       INT AUTO_INCREMENT PRIMARY KEY,
      username      VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(150) NOT NULL,
      email         VARCHAR(150),
      role          ENUM('Admin','SSE','Viewer') NOT NULL DEFAULT 'Viewer',
      EMISCARDNUMBER VARCHAR(20),
      shop_code     VARCHAR(20),
      is_active     TINYINT(1) DEFAULT 1,
      last_login    TIMESTAMP NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_role (role)
    ) ENGINE=InnoDB`);

    await run(conn, `CREATE TABLE IF NOT EXISTS audit_logs (
      log_id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT,
      username        VARCHAR(50),
      action          VARCHAR(100) NOT NULL,
      resource        VARCHAR(100),
      ip_address      VARCHAR(45),
      response_status INT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB`);

    await run(conn, `CREATE TABLE IF NOT EXISTS notifications (
      notif_id   INT AUTO_INCREMENT PRIMARY KEY,
      title      VARCHAR(200) NOT NULL,
      message    TEXT NOT NULL,
      type       ENUM('alert','warning','info','success') DEFAULT 'info',
      shop_code  VARCHAR(20),
      is_read    TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_is_read (is_read)
    ) ENGINE=InnoDB`);

    console.log('\n✅ All tables created\n');

    // ── SEED SHOPS ─────────────────────────────────────────
    console.log('🌱 Seeding shops...');
    const shops = [
      ['CMC', 'Carriage Machine Shop', 'Production', 'Mechanical', 'ICF Chennai'],
      ['WRS', 'Wheel & Roller Shop', 'Production', 'Mechanical', 'ICF Chennai'],
      ['PRS', 'Paint & Rust Prevention Shop', 'Production', 'Mechanical', 'ICF Chennai'],
      ['FRS', 'Furnishing Shop', 'Production', 'Mechanical', 'ICF Chennai'],
      ['ELS', 'Electrical Shop', 'Production', 'Electrical', 'ICF Chennai'],
      ['TRS', 'Trimming Shop', 'Production', 'Mechanical', 'ICF Chennai'],
      ['BDS', 'Body & Bogie Shop', 'Production', 'Mechanical', 'ICF Chennai'],
      ['HRS', 'Heat Treatment Shop', 'Production', 'Mechanical', 'ICF Chennai'],
      ['QCS', 'Quality Control Section', 'Quality', 'QA', 'ICF Chennai'],
      ['ADM', 'Administration', 'Admin', 'General', 'ICF Chennai'],
      ['MED', 'Medical Department', 'Medical', 'Health', 'ICF Chennai'],
      ['STR', 'Stores Department', 'Stores', 'Logistics', 'ICF Chennai'],
    ];
    for (const s of shops) {
      await run(conn, `INSERT IGNORE INTO shops (shop_code,shop_name,department,division,location) VALUES ('${s[0]}','${s[1]}','${s[2]}','${s[3]}','${s[4]}')`);
    }
    console.log(' done');

    // ── SEED EMPLOYEES ─────────────────────────────────────
    console.log('🌱 Seeding employees...');
    const employees = [
      ['ICF001001', 'RAJESH KUMAR', 'Senior Section Engineer', 'Production', 'CMC', 'Supervisory', 'JA', '2005-06-15', '1975-03-20', 'Male'],
      ['ICF001002', 'SURESH BABU', 'Technician Gr-I', 'Production', 'CMC', 'Non-Supervisory', 'GP2800', '2008-09-01', '1982-07-14', 'Male'],
      ['ICF001003', 'PRIYA DEVI', 'Junior Engineer', 'Production', 'CMC', 'Supervisory', 'JE', '2012-03-20', '1988-11-05', 'Female'],
      ['ICF001004', 'MURUGAN S', 'Technician Gr-II', 'Production', 'CMC', 'Non-Supervisory', 'GP2400', '2010-07-10', '1985-04-22', 'Male'],
      ['ICF001005', 'LAKSHMI R', 'Technician Gr-III', 'Production', 'CMC', 'Non-Supervisory', 'GP1900', '2015-01-05', '1990-08-30', 'Female'],
      ['ICF002001', 'VENKATESH P', 'Senior Section Engineer', 'Production', 'WRS', 'Supervisory', 'JA', '2003-11-20', '1973-12-10', 'Male'],
      ['ICF002002', 'ANAND K', 'Technician Gr-I', 'Production', 'WRS', 'Non-Supervisory', 'GP2800', '2007-04-15', '1980-06-18', 'Male'],
      ['ICF002003', 'KAVITHA M', 'Junior Engineer', 'Production', 'WRS', 'Supervisory', 'JE', '2014-08-01', '1989-02-25', 'Female'],
      ['ICF002004', 'RAJAN T', 'Technician Gr-II', 'Production', 'WRS', 'Non-Supervisory', 'GP2400', '2011-05-20', '1986-09-12', 'Male'],
      ['ICF002005', 'SELVI A', 'Technician Gr-III', 'Production', 'WRS', 'Non-Supervisory', 'GP1900', '2016-03-10', '1992-01-08', 'Female'],
      ['ICF003001', 'KRISHNAMURTHY V', 'Section Engineer', 'Production', 'PRS', 'Supervisory', 'SS', '2006-02-14', '1976-05-30', 'Male'],
      ['ICF003002', 'BALAMURUGAN R', 'Technician Gr-I', 'Production', 'PRS', 'Non-Supervisory', 'GP2800', '2009-10-05', '1983-10-15', 'Male'],
      ['ICF003003', 'MEENA S', 'Technician Gr-II', 'Production', 'PRS', 'Non-Supervisory', 'GP2400', '2013-06-25', '1987-07-20', 'Female'],
      ['ICF004001', 'SUNDARAM K', 'Senior Section Engineer', 'Production', 'FRS', 'Supervisory', 'JA', '2004-08-30', '1974-09-05', 'Male'],
      ['ICF004002', 'GANESAN M', 'Technician Gr-I', 'Production', 'FRS', 'Non-Supervisory', 'GP2800', '2008-12-15', '1981-03-28', 'Male'],
      ['ICF004003', 'RADHA P', 'Technician Gr-III', 'Production', 'FRS', 'Non-Supervisory', 'GP1900', '2017-02-20', '1993-06-14', 'Female'],
      ['ICF005001', 'ARUMUGAM S', 'Senior Section Engineer', 'Electrical', 'ELS', 'Supervisory', 'JA', '2002-05-10', '1972-11-22', 'Male'],
      ['ICF005002', 'VIJAYALAKSHMI T', 'Junior Engineer', 'Electrical', 'ELS', 'Supervisory', 'JE', '2013-09-15', '1988-04-17', 'Female'],
      ['ICF005003', 'SENTHIL K', 'Technician Gr-I', 'Electrical', 'ELS', 'Non-Supervisory', 'GP2800', '2006-07-20', '1979-08-03', 'Male'],
      ['ICF005004', 'DEEPA R', 'Technician Gr-II', 'Electrical', 'ELS', 'Non-Supervisory', 'GP2400', '2012-11-10', '1986-12-25', 'Female'],
      ['ICF006001', 'PALANISWAMY G', 'Section Engineer', 'Production', 'TRS', 'Supervisory', 'SS', '2007-03-05', '1977-07-18', 'Male'],
      ['ICF006002', 'RAMESH B', 'Technician Gr-I', 'Production', 'TRS', 'Non-Supervisory', 'GP2800', '2010-01-25', '1984-02-10', 'Male'],
      ['ICF007001', 'NATARAJAN P', 'Senior Section Engineer', 'Production', 'BDS', 'Supervisory', 'JA', '2001-09-12', '1971-04-06', 'Male'],
      ['ICF007002', 'SARASWATHI K', 'Junior Engineer', 'Production', 'BDS', 'Supervisory', 'JE', '2015-06-30', '1990-10-19', 'Female'],
      ['ICF007003', 'MANIKANDAN R', 'Technician Gr-I', 'Production', 'BDS', 'Non-Supervisory', 'GP2800', '2005-04-18', '1978-01-30', 'Male'],
      ['ICF008001', 'CHANDRASEKARAN V', 'Section Engineer', 'Production', 'HRS', 'Supervisory', 'SS', '2008-08-22', '1978-06-12', 'Male'],
      ['ICF008002', 'THILAGAM S', 'Technician Gr-II', 'Production', 'HRS', 'Non-Supervisory', 'GP2400', '2014-04-08', '1989-03-07', 'Female'],
      ['ICF009001', 'SUBRAMANIAN K', 'Quality Inspector', 'Quality', 'QCS', 'Supervisory', 'SS', '2009-11-30', '1979-09-24', 'Male'],
      ['ICF009002', 'NIRMALA D', 'Technician Gr-I', 'Quality', 'QCS', 'Non-Supervisory', 'GP2800', '2011-07-14', '1985-05-16', 'Female'],
      ['ICF010001', 'GOVINDARAJAN M', 'Office Superintendent', 'Admin', 'ADM', 'Supervisory', 'OS', '2000-03-01', '1970-02-28', 'Male'],
    ];
    for (const e of employees) {
      await run(conn, `INSERT IGNORE INTO employees (EMISCARDNUMBER,emp_name,designation,department,shop_code,category,grade,date_of_joining,date_of_birth,gender) VALUES ('${e[0]}','${e[1]}','${e[2]}','${e[3]}','${e[4]}','${e[5]}','${e[6]}','${e[7]}','${e[8]}','${e[9]}')`);
    }
    console.log(' done');

    // ── SEED CUG CONTACTS ──────────────────────────────────
    console.log('🌱 Seeding CUG contacts...');
    const contacts = [
      ['RAJESH KUMAR', 'ICF001001', '9444001001', 'Senior Section Engineer', 'CMC', 'Production'],
      ['VENKATESH P', 'ICF002001', '9444002001', 'Senior Section Engineer', 'WRS', 'Production'],
      ['KRISHNAMURTHY V', 'ICF003001', '9444003001', 'Section Engineer', 'PRS', 'Production'],
      ['SUNDARAM K', 'ICF004001', '9444004001', 'Senior Section Engineer', 'FRS', 'Production'],
      ['ARUMUGAM S', 'ICF005001', '9444005001', 'Senior Section Engineer', 'ELS', 'Electrical'],
      ['PALANISWAMY G', 'ICF006001', '9444006001', 'Section Engineer', 'TRS', 'Production'],
      ['NATARAJAN P', 'ICF007001', '9444007001', 'Senior Section Engineer', 'BDS', 'Production'],
      ['CHANDRASEKARAN V', 'ICF008001', '9444008001', 'Section Engineer', 'HRS', 'Production'],
      ['SUBRAMANIAN K', 'ICF009001', '9444009001', 'Quality Inspector', 'QCS', 'Quality'],
      ['GOVINDARAJAN M', 'ICF010001', '9444010001', 'Office Superintendent', 'ADM', 'Admin'],
    ];
    for (const c of contacts) {
      await run(conn, `INSERT IGNORE INTO cug_contacts (sse_name,EMISCARDNUMBER,cug_number,designation,shop_code,department) VALUES ('${c[0]}','${c[1]}','${c[2]}','${c[3]}','${c[4]}','${c[5]}')`);
    }
    console.log(' done');

    // ── SEED SICK/FIT RECORDS ──────────────────────────────
    console.log('🌱 Seeding sick/fit records...');
    const records = [
      ['ICF001002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 85 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 78 DAY)', 'Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF001004', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 80 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 73 DAY)', 'Back Pain', 'Dr. Meenakshi', 'ICF Hospital'],
      ['ICF002002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 75 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 68 DAY)', 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF002004', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 70 DAY)', null, 'Chronic Back Pain', 'Dr. Suresh', 'ICF Hospital'],
      ['ICF003002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 65 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 58 DAY)', 'Hypertension', 'Dr. Meenakshi', 'ICF Hospital'],
      ['ICF004002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 60 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 53 DAY)', 'Dengue Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF005003', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 55 DAY)', null, 'Diabetes Complications', 'Dr. Suresh', 'ICF Hospital'],
      ['ICF006002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 50 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 43 DAY)', 'Fracture', 'Dr. Orthopedic', 'Government Hospital'],
      ['ICF007003', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 45 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 38 DAY)', 'Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF008002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 40 DAY)', null, 'Respiratory Issues', 'Dr. Meenakshi', 'ICF Hospital'],
      ['ICF001005', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 35 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 28 DAY)', 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF002005', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 30 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 23 DAY)', 'Typhoid', 'Dr. Suresh', 'ICF Hospital'],
      ['ICF003003', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 25 DAY)', null, 'Knee Pain', 'Dr. Orthopedic', 'Government Hospital'],
      ['ICF004003', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 20 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 13 DAY)', 'Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF005004', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 18 DAY)', null, 'Hypertension', 'Dr. Meenakshi', 'ICF Hospital'],
      ['ICF007002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 15 DAY)', 'DATE_SUB(CURDATE(),INTERVAL 8 DAY)', 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF009002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 12 DAY)', null, 'Back Pain', 'Dr. Suresh', 'ICF Hospital'],
      ['ICF001002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 10 DAY)', null, 'Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF002002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 8 DAY)', null, 'Dengue Fever', 'Dr. Meenakshi', 'ICF Hospital'],
      ['ICF006002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 6 DAY)', null, 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF007003', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 5 DAY)', null, 'Hypertension', 'Dr. Suresh', 'ICF Hospital'],
      ['ICF008002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 4 DAY)', null, 'Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF001004', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 3 DAY)', null, 'Back Pain', 'Dr. Meenakshi', 'ICF Hospital'],
      ['ICF003002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 2 DAY)', null, 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital'],
      ['ICF004002', 'Sick', 'DATE_SUB(CURDATE(),INTERVAL 1 DAY)', null, 'Fever', 'Dr. Suresh', 'ICF Hospital'],
      ['ICF005003', 'Sick', 'CURDATE()', null, 'Respiratory Issues', 'Dr. Meenakshi', 'ICF Hospital'],
    ];
    for (const r of records) {
      const fitDate = r[3] ? r[3] : 'NULL';
      const actualStatus = r[3] ? 'Fit' : 'Sick';  // If fit_date exists, status should be 'Fit'
      const daysExpr = r[3] ? `DATEDIFF(${r[3]}, ${r[2]})` : `DATEDIFF(CURDATE(), ${r[2]})`;
      await run(conn, `INSERT INTO sick_fit_records (EMISCARDNUMBER,status,sick_date,fit_date,days_count,diagnosis,reporting_doctor,hospital_name,week_number,month_number,year_number) VALUES ('${r[0]}','${actualStatus}',${r[2]},${fitDate},${daysExpr},'${r[4]}','${r[5]}','${r[6]}',WEEK(${r[2]},1),MONTH(${r[2]}),YEAR(${r[2]}))`);
    }
    console.log(' done');

    // ── SEED USERS ─────────────────────────────────────────
    console.log('🌱 Seeding users...');
    const hash = await bcrypt.hash('Admin@123', 10);
    const users = [
      ['admin', hash, 'System Administrator', 'admin@icf.railnet.gov.in', 'Admin', null],
      ['pcmo', hash, 'Principal Chief Medical Officer', 'pcmo@icf.railnet.gov.in', 'Admin', null],
      ['sse_cmc', hash, 'RAJESH KUMAR', 'sse.cmc@icf.railnet.gov.in', 'SSE', 'CMC'],
      ['sse_wrs', hash, 'VENKATESH P', 'sse.wrs@icf.railnet.gov.in', 'SSE', 'WRS'],
      ['sse_els', hash, 'ARUMUGAM S', 'sse.els@icf.railnet.gov.in', 'SSE', 'ELS'],
    ];
    for (const u of users) {
      const shopVal = u[5] ? `'${u[5]}'` : 'NULL';
      await run(conn, `INSERT IGNORE INTO users (username,password_hash,full_name,email,role,shop_code) VALUES ('${u[0]}','${u[1]}','${u[2]}','${u[3]}','${u[4]}',${shopVal})`);
    }
    console.log(' done');

    // ── SEED NOTIFICATIONS ─────────────────────────────────
    console.log('🌱 Seeding notifications...');
    await run(conn, `INSERT IGNORE INTO notifications (title,message,type,shop_code) VALUES ('High Sick Count Alert','CMC shop has 5 employees on sick leave this week','alert','CMC')`);
    await run(conn, `INSERT IGNORE INTO notifications (title,message,type) VALUES ('New Cases Today','3 new sick cases reported today across ICF','warning')`);
    await run(conn, `INSERT IGNORE INTO notifications (title,message,type) VALUES ('Weekly Report Ready','Weekly sick/fit monitoring report is ready','info')`);
    await run(conn, `INSERT IGNORE INTO notifications (title,message,type,shop_code) VALUES ('Recovery Update','2 employees from WRS shop declared fit','success','WRS')`);
    console.log(' done');

    // ── VERIFY ─────────────────────────────────────────────
    console.log('\n📊 Final Verification:');
    const tables = ['shops', 'employees', 'sick_fit_records', 'cug_contacts', 'users', 'notifications'];
    for (const t of tables) {
      const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM ${t}`);
      console.log(`   ${t.padEnd(22)} → ${rows[0].cnt} rows`);
    }

    console.log('\n=====================================');
    console.log('✅  DATABASE SETUP COMPLETE!');
    console.log('=====================================');
    console.log('\nLogin: admin / Admin@123');
    console.log('Now restart the backend server!\n');

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

setup();
