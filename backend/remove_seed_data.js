/**
 * Removes fake seed data (ICF% employees and their sick records)
 * that were inserted by seed.sql and inflate the dashboard count.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'icf_hmis',
  });

  console.log('=== Removing fake seed data ===\n');

  await c.execute('SET FOREIGN_KEY_CHECKS = 0');

  // 1. Delete sick records belonging to fake seed employees
  const [d1] = await c.execute("DELETE FROM sick_fit_records WHERE EMISCARDNUMBER LIKE 'ICF%'");
  console.log(`Deleted ${d1.affectedRows} sick records from fake seed employees`);

  // 2. Delete CUG contacts for fake seed employees
  const [d2] = await c.execute("DELETE FROM cug_contacts WHERE EMISCARDNUMBER LIKE 'ICF%'");
  console.log(`Deleted ${d2.affectedRows} CUG contacts from fake seed employees`);

  // 3. Delete the fake seed employees themselves
  const [d3] = await c.execute("DELETE FROM employees WHERE EMISCARDNUMBER LIKE 'ICF%'");
  console.log(`Deleted ${d3.affectedRows} fake seed employees`);

  await c.execute('SET FOREIGN_KEY_CHECKS = 1');

  // 4. Verify final counts
  const [r1] = await c.execute('SELECT COUNT(*) AS total FROM sick_fit_records');
  const [r2] = await c.execute('SELECT COUNT(*) AS total FROM employees');
  const [r3] = await c.execute('SELECT COUNT(DISTINCT EMISCARDNUMBER) AS total FROM sick_fit_records');

  console.log('\n=== After cleanup ===');
  console.log('Total sick_fit_records rows          :', r1[0].total);
  console.log('Total employees                      :', r2[0].total);
  console.log('Distinct employees with sick records :', r3[0].total);

  await c.end();
  console.log('\nDone. Refresh the dashboard to see the corrected count.');
})().catch(e => console.error('Error:', e.message));
