const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const app = express();
const session = require('express-session');
const multer = require('multer');
const Swal = require('sweetalert2');

app.use(session({
  secret: 'abcdefghijkl',
  resave: true,
  saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); // Directorio donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo (timestamp + nombre original)
  }
});

const upload = multer({ storage: storage });


// Configurar Express para usar EJS
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/libreria', (req, res) => {
  res.render('libreria');
});

app.get('/nosotrosUser', (req, res) => {
    res.render('nosotrosUser');
  });
  app.get('/nosotros', (req, res) => {
    res.render('nosotros');
  });
  app.get('/asesorias', (req, res) => {
    res.render('asesorias');
  });
  app.get('/contacto', (req, res) => {
    res.render('contacto');
  });
  app.get('/servicios', (req, res) => {
    res.render('servicios');
  });

function requireLogin(req, res, next) {
  if (req.session.loggedin) {
    next(); // El usuario está logueado, continúa con la solicitud
  } else {
    res.redirect('/login'); // El usuario no está logueado, redirige a la página de inicio de sesión
  }
} 

app.get('/admin', requireLogin, async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sistemaacademico'
    });

    const [rows, fields] = await connection.execute('SELECT * FROM user');

    res.render('admin', {
      users: rows
    });

    await connection.end();
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/check_login', async (req, res) => {
  const user = req.body.user;
  const pass = req.body.pass;

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sistemaacademico'
    });

    const sql = `SELECT * FROM login WHERE user='${user}' AND pass='${pass}'`;
    const [rows, fields] = await connection.execute(sql);

    if (rows.length > 0) {
      req.session.loggedin = true; // Marcar al usuario como logueado
      res.send('success');
    } else {
      res.send('failure');
    }

    await connection.end();
  } catch (error) {
    console.error('Error en la verificación:', error);
    res.send('error');
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sistemaacademico'
    });

    const [rows, fields] = await connection.execute('SELECT * FROM user');

    res.json(rows);

    await connection.end();
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Ruta para crear usuario (mostrar formulario)
app.get('/admin/create', requireLogin, (req, res) => {
  res.render('create-user');
});

// Ruta para procesar la creación de un usuario
app.post('/admin/create', requireLogin, upload.single('img'), async (req, res) => {
  const { name, age, description, semestre, curso } = req.body;
  const img = req.file.filename; // Nombre del archivo guardado


  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sistemaacademico'
    });

    const sql = `INSERT INTO user (name, age, description, semestre, curso, img) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [name, age, description, semestre, curso, img];

    if (!name || !age || !description || !semestre || !curso || !img) {
      console.error('Alguno de los campos está vacío:', { name, age, description, semestre, curso, img });
      return res.status(400).send('Todos los campos son requeridos.');
    } else {
      await connection.execute(sql, values);

      await connection.end();

      // Agregar SweetAlert2 a la respuesta
      res.send(`
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          Swal.fire({
            icon: 'success',
            title: 'Usuario creado con éxito',
            showConfirmButton: false,
            timer: 1500
          }).then(function() {
            window.location.href = '/admin';
          });
        });
      </script>
    `);
    }
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/admin/edit/:id', requireLogin, async (req, res) => {
  const userId = req.params.id;

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sistemaacademico'
    });

    const sql = `SELECT * FROM user WHERE id=?`;
    const [user] = await connection.execute(sql, [userId]);

    await connection.end();

    if (user.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.render('edit-user', { user: user[0] }); // Renderizar la vista de edición con los datos del usuario
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/admin/edit/:id', requireLogin, async (req, res) => {
    const userId = req.params.id;
  
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'sistemaacademico'
      });
  
      let name = "JULIO MENDOZA"
      let age = "30"
      let description = "Estudiante autodidacta"
      let semestre = 9
      let curso = "Ingenieria de sistemas"
      let img = "usuario4.jpg"
  
      const sql = `UPDATE user SET name=?, age=?, description=?, semestre=?, curso=?, img=? WHERE id=?`;
      const values = [name, age, description, semestre, curso, img, userId];
  
      await connection.execute(sql, values);
  
      await connection.end();
  
      res.redirect('/admin');
    } catch (error) {
      console.error('Error al editar el usuario:', error);
      res.status(500).send('Internal Server Error');
    }
  });

// Ruta para eliminar usuario
app.delete('/admin/delete/:id', requireLogin, async (req, res) => {
  const userId = req.params.id;

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sistemaacademico'
    });

    const sql = `DELETE FROM user WHERE id=${userId}`;

    await connection.execute(sql);

    await connection.end();

    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.listen(3000, () => {
  console.log('Servidor en marcha en http://localhost:3000');
});