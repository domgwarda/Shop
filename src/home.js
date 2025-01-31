import express, { query } from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import session from 'express-session';
import pg from 'pg';

const { Pool } = pg;

var app = express();
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('./static'));
app.use('/images', express.static('images'));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'weppo-projekt',
  password: 'nivea',
  port: 5432,
});

app.get('/products/:from(\\d+)/?', async (req, res) => {
  console.log('req.params', req.params);
  const from = parseInt(req.params.from, 10);
  const query = 'SELECT * FROM Products LIMIT 3 OFFSET $1';
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
    res.render('home.ejs');
});
  
app.get('/add-product', (req, res) => {
      if (true) {  //   if req.session.isAdmin kiedy zalogowany admin
        res.render('add-product.ejs');
    }
    else {
      res.redirect('/login');
    }
  });

app.post('/add-product', (req, res) => {
  const { name, cost, image, type } = req.body;

  if (!name || !cost || !image || !type) {
    return res.status(400).send('All fields are required');
  }

  const query = 'INSERT INTO products (name, cost, image, type) VALUES ($1, $2, $3, $4)';
  const values = [name, cost, image, type];

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error executing query', err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.send('Product added successfully!');
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  users.forEach(user => {
    if (user.username === username && user.password === password) {
      console.log("Zalogowano pomyślnie: ", username);
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register.ejs")
})

app.post("/register", (req, res) => {
  const { username, password, cpassword, email, phone, date} = req.body;
  console.log("Login:", username, "Hasło:", password);
});


app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  users.forEach(user => {
    if (user.username === username && user.password === password) {
      console.log("Ok: ", username);
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register.ejs")
})

app.post("/register", (req, res) => {
  const { username, password, cpassword, email, phone, date} = req.body;
  console.log("Login:", username, "Password:", password);
});

http.createServer(app).listen(3011);