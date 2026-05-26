require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'icf_hmis',
  });

  const [r1] = await c.execute('SELECT COUNT(*) AS total FROM sick_fit_records');
  const [r2] = await c.execute('SELECT COUNT(*) AS total FROM employees');
  const [r3] = await c.execute("SELECT COUNT(*) AS total FROM employees WHERE EMISCARDNUMBER LIKE 'ICF%'");
  const [r4] = await c.execute('SELECT COUNT(DISTINCT EMISCARDNUMBER) AS total FROM sick_fit_records');
  const [r5] = await c.execute("SELECT COUNT(*) AS total FROM sick_fit_records WHERE EMISCARDNUMBER LIKE 'ICF%'");
  const [r6] = await c.execute("SELECT COUNT(DISTINCT EMISCARDNUMBER) AS total FROM sick_fit_records WHERE EMISCARDNUMBER NOT LIKE 'ICF%'");

  console.log('=== DATABASE COUNT AUDIT ===');
  console.log('Total sick_fit_records rows          :', r1[0].total);
  console.log('Total employees                      :', r2[0].total);
  console.log('Fake seed employees (EMIS like ICF%) :', r3[0].total);
  console.log('Distinct employees with sick records :', r4[0].total);
  console.log('Sick records from fake seed (ICF%)   :', r5[0].total);
  console.log('Distinct REAL employees with sick rec:', r6[0].total);

  await c.end();
})().catch(e => console.error('Error:', e.message));
