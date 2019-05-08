const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require('morgan');
const bodyParser = require("body-parser");

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let generatedShort = function generateRandomString() {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};


//console.log(generateRandomString());


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase }; //when sending variable to EJS template, must always be in object format - even if there is just one key/value so we can call key/value when needed. Again never going to need the key??
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const newShort = generatedShort();
  urlDatabase[newShort] = req.body.longURL;
  console.log(urlDatabase);
  //console.log(generatedShort());  // Log the POST request body to the console
  res.redirect("/urls/" + newShort);         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  // let templateVars = {
  //   shortURL: req.params.shortURL
  //   longURL: urlDatabase['req.params.shortURL']
  // }
  console.log(req.params.shortURL)
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.get("/urls/:shortURL", (req,res) => {
  let templateVars = {
    shortURL: req.params.shortURL, //are you ever going to want to access the key? can you do this? or would you only need the value??
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});