const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const cookieKey = "user_id";

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

let generatedShort = function generateRandomString() {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

function emailDoesNotExist(users, email) {
  for (var key in users) {
    if (users[key].email === email) {
      return false;
    }
  }
   return true;
}

function passwordEmailValidation(users, password, email) {
  for (var key in users) {
    if (users[key].email === email && users[key].password === password) {
      return true;
    }
  }
  return false;
}


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  res.render("urls_registration");
});

app.post("/register", (req, res) => {
  const id = generatedShort();
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    res.status(400).send("Not Found. Please enter both email & password.");
  } else if (!emailDoesNotExist(users, email)) {
    res
      .status(400)
      .send(
        "Your email address already exists! Please login rather than register."
      );
  } else {
    users[id] = {
      id: id,
      email: email,
      password: password
    };
  }

  res.cookie(cookieKey, id);

  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies[cookieKey]],
    urls: urlDatabase
  }; //when sending variable to EJS template, must always be in object format - even if there is just one key/value so we can call key/value when needed. Again never going to need the key??
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    userDatabase: users,
    user: users[req.cookies[cookieKey]],
    urls: urlDatabase
  };
  res.render("urls_login", templateVars);
});






app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  function getID(users) {
    for (var key in users) {
      console.log('key',key)
      if (users[key].email === email) {
        return users[key].id;
      }
    }
  }

  const id = getID(users);
  console.log('id', id)
  if (emailDoesNotExist(users, email)) {
    res
      .status(403)
      .send("Your email address does not exist! Please register than login.");
  } else if (!passwordEmailValidation(users, password, email)) {
    res.status(403).send("your email address or password is incorrect!");
  } else {
    res.cookie(cookieKey, id)
    res.redirect("/urls");
  }


});








app.post("/logout", (req, res) => {
  res.clearCookie(cookieKey); //how do i get the name of current cookie?
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies[cookieKey]]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const newShort = generatedShort();
  urlDatabase[newShort] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect("/urls/" + newShort); // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  //do i need to link this to anything? currently can only access when typed directly to browser?`
  console.log(req.params.shortURL);
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log(shortURL);
  delete urlDatabase[shortURL]; // delete from the DB

  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log(shortURL);
  let longURLUpdated = req.body.updatedLongURL;
  console.log(longURLUpdated);
  urlDatabase[shortURL] = longURLUpdated;

  res.redirect("/urls");
  //res.render("urls/" + shortURL); //go back to URL page and should show updated long URL
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    user: users[req.cookies[cookieKey]],
    shortURL: req.params.shortURL, //are you ever going to want to access the key? can you do this? or would you only need the value??
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
