import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import session from 'express-session';
import pg from 'pg';

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://xisipkssprvmcqsceyup.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc2lwa3NzcHJ2bWNxc2NleXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMzg4MTYsImV4cCI6MjA1MzkxNDgxNn0.0Im13iHWAjULkOpKEHuJei70q1KBC8groYnxntVzpgY'
const supabase = createClient(supabaseUrl, supabaseKey)

import { users } from "./users.js"

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

app.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    res.json(data);
    

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/login", (req, res) => {
  const error = req.query.error;
  res.render("login", { error });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Próba logowania:", username, password);

  try {
    const { data, error } = await supabase.from("users").select("password").eq("username", username).single();
    
    if (error || !data) {
      return res.redirect("/login?error=Użytkownik%20nie%20istnieje");
    }

    if (data.password !== password) {
      return res.redirect("/login?error=Nieprawidłowe%20hasło");
    }

    res.json({ message: "Zalogowano pomyślnie", user: data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/register", (req, res) => {
  const error = req.query.error;
  res.render("register", { error });
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
  res.render("register")
})

app.post('/register', async (req, res) => {
  const { username, password, cpassword, email, phone, dob} = req.body;

  if (!username || !password || !cpassword || !email || !phone || !dob) {
    return res.redirect("/register?error=Brak%20wprowadzonych%20danych");
  }

  try {
    const { data, error } = await supabase.from('users').insert([{ username, password, email, phone, dob }]);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Zarejestrowano pomyślnie!', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

http.createServer(app).listen(3011);