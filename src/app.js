import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import session from 'express-session';
import multer from 'multer';
import pg from 'pg';

// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = 'https://xisipkssprvmcqsceyup.supabase.co'
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc2lwa3NzcHJ2bWNxc2NleXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMzg4MTYsImV4cCI6MjA1MzkxNDgxNn0.0Im13iHWAjULkOpKEHuJei70q1KBC8groYnxntVzpgY'
// const supabase = createClient(supabaseUrl, supabaseKey)

import { users } from "./users.js"
import e from 'express';

const { Pool } = pg;

var app = express();
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("./static"));
app.use('/images', express.static('images'));

app.use(session({
    secret: 'weppo-projekt',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false , maxAge: 60000 },
}));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'weppo-projekt',
    password: 'nivea',
    port: 5432,
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    filename: (req, file, cb) => {
        const name = req.body.name.replace(/\s+/g, '_');
        const filename = `${name}.png`;
        cb(null, filename);
    },
});

const upload = multer({ storage });

app.use((req, res, next) => {
    console.log('Request:', req.method, req.url);
    next();
});

app.get('/set-session', (req, res) => {
    req.session.user = { id: 1, username: 'admin' };
    res.send('Session set');
});

app.get('/get-session', (req, res) => {
    if (req.session.user) {
        res.send('Session data: '
            + JSON.stringify(req.session.user));
    } else {
        res.send('No session data found');
    }
});

app.get('/destroy-session', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.send('Error destroying session');
        } else {
            res.send('Session destroyed');
        }
    });
});

app.get('/products/:from(\\d+)/?', async (req, res) => {
    console.log('req.params', req.params);
    const from = parseInt(req.params.from, 10);
    const query = 'SELECT * FROM Products ORDER BY id ASC LIMIT 3 OFFSET $1';
    const values = [from];

    pool.query(query, values, async (err, result) => {
        if (err) {
            console.error('Error executing query', err.stack);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            const products = result.rows;
            res.json(products);
        }
    });
});

app.get('/', function (req, res) {
    const notLogged = !req.session.user;
    const isAdmin = req.session.isAdmin;
    if (isAdmin){
    res.render('home.ejs', { notLogged , isAdmin });
    }
    else {
        res.render('home.ejs', { notLogged , isAdmin: false });
    }
});

app.get('/add-product', (req, res) => {
    const notLogged = !req.session.user;
    const isAdmin = req.session.isAdmin || false;
    if( isAdmin){
        res.render('add-product.ejs', { notLogged, isAdmin });
    }
    else {
        res.redirect('/login');
    }
    
});

app.post('/add-product', upload.single('image'), (req, res) => {
    const { name, cost, type } = req.body;
    if (!name || !cost || !type) {
        return res.status(400).send('All fields are required');
    }

    const imagePath = `images/${req.file.filename}`; // Custom path for the image
    const query = 'INSERT INTO products (name, cost, image, type) VALUES ($1, $2, $3, $4)';
    const values = [name, cost, imagePath, type];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Error executing query', err.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.send('Product added successfully!');
    });
});

app.get('/login', (req, res) => {
    const error = req.query.error;
    res.render('login', { error });
  });



app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    req.session.user = { username, password };
  
    pool.query('SELECT * FROM users', (err, result) => {
      if (err) {
        console.log(err.message);
        return res.status(500).send('Server error');
      }
  
      let userFound = false;
      result.rows.forEach((row) => {
        if (row.username === username) {
          userFound = true;
          if (row.password !== password) {
            return res.redirect("/login?error=Niepoprawne%20hasło");
          }
          if (row.username === 'admin') {
            req.session.isAdmin = true;
          }
          return res.redirect('/');
        }
      });
  
      if (!userFound) {
        return res.redirect("/login?error=Użytkownik%20nieznaleziony");
      }
    });
  });

app.get("/register", (req, res) => {
    const error = req.query.error;
    res.render("register", { error });
})

// app.post("/register", (req, res) => {
//     const { username, password, cpassword, email, phone, date } = req.body;
//     console.log("Login:", username, "Hasło:", password);
// });

//


app.get('/register', (req, res) => {
    const error = req.query.error;
    res.render('register', { error });
});

app.post('/register', async (req, res) => {
    const { username, password, 'confirm-password': cpassword, email, phone, dob } = req.body;
    console.log("Request Body:", req.body);
    console.log("Password:", password, "Confirm Password:", cpassword);
  
    if (!username || !password || !cpassword || !email || !phone || !dob) {
      return res.redirect("/register?error=Empty%20data%20");
    }
  
    if (password!==cpassword) {
      return res.redirect("/register?error=Different%20passwords");
    }
  
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    
    if (userCheck.rows.length > 0) {
      return res.redirect("/register?error=Username%20or%20email%20exists");
    }
  
    try {
      const result = await pool.query(
        "INSERT INTO public.users(username, password, email, phone, dob) VALUES ($1, $2, $3, $4, $5);",
        [username, password, email, phone, dob]
      );
  
      return res.redirect("/login?error=User%20added")
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Błąd serwera" });
    }
  });

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
    if (err) {
    console.error('Error destroying session:', err);
    }
    res.redirect('/');
});
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
    return res.redirect('/login?error=Proszę%20się%20zalogować');
    }

    res.render('add-product', { user: req.session.user });
});

http.createServer(app).listen(3000);