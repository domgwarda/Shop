import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import session from 'express-session';
import pg from 'pg';

const { Pool } = pg;

var app = express();
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("./static"));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'weppo-projekt',
  password: 'nivea',
  port: 5432,
});

app.get('/products', async (req, res) => {
  const query = 'SELECT * FROM Products'; 

  pool.query(query, (err, result) => {
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
      var name = req.body.name;
      var price = req.body.price;
      var image = req.body.image;
      if (name && price && image) {
          res.render('add-product.ejs', { name: name, price: price, image: image });
      }
    }
    else {
      res.redirect('/login');
    }
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

//

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