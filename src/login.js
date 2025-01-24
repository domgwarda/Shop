import express from "express"
import bodyParser from "body-parser"
import http from "http"

const app = express();
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use( express.static( "./static" ) );

//lista
app.get('/', (req, res) => {
  res.render('login.ejs')
});


http.createServer(app).listen(3010);
