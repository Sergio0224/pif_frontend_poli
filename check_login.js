const mysql = require('mysql2/promise');

async function checkLogin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sistemaacademico'
  });
console.log(checkLogin())
  const user = process.argv[2];
  const pass = process.argv[3];

  const sql = `SELECT * FROM login WHERE user='${user}' AND pass='${pass}'`;

  const [rows, fields] = await connection.execute(sql);

  if (rows.length > 0) {
    console.log('success');
  } else {
    console.log('failure');
  }

  await connection.end();
}

checkLogin();