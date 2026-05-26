const fs = require('fs');
const path = require('path');
const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
files.forEach(f => {
  const filePath = path.join(routesDir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("pool.execute('SELECT 1')")) {
    content = content.replace(/pool\.execute\('SELECT 1'\)/g, "pool.execute('SELECT 1 FROM users LIMIT 1')");
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + f);
  }
});
