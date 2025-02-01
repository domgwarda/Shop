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
app.use('/images', express.static('images'));


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'weppo-projekt',
  password: '1',
  port: 5432,
});

pool.connect()


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
})

///


app.get("/login", (req, res) => {
  const error = req.query.error;
  res.render("login", { error });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

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

app.post('/register', async (req, res) => {
  const { username, password, cpassword, email, phone, dob} = req.body;
  console.log(password, cpassword)

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



app.get("/cart", (req, res) => {
  pool.query(
    "SELECT name, type, price, COUNT(*) as quantity FROM cart GROUP BY name, type, price", 
    (err, result) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
      }
      const products = result.rows ? result.rows : result;
      res.render("cart", { products: Array.isArray(products) ? products : [] });
    }
  );
});

app.post("/cart", (req, res) => {
  pool.query("DELETE FROM cart", (err, result) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Server error");
    }
    res.redirect("/");
  });
});


http.createServer(app).listen(3011)