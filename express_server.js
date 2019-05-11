const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));


app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"]
  })
);

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
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

function urlsForUser(userId) {
  let urlsObject = {};
  for (let shortURL in urlDatabase) {
    if (userId === urlDatabase[shortURL].userID) {
      urlsObject[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return urlsObject;
}

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

app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  res.render("urls_registration");
});

app.post("/register", (req, res) => {
  const id = generatedShort();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 12);

  if (!email || !password) {
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

  req.session.user_id = id;
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  let urls;
  if (user) {
    urls = urlsForUser(user.id);
  }
  let templateVars = {
    user: user,
    urls: urls
  };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    userDatabase: users,
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  function getID(users) {
    for (var key in users) {
      if (users[key].email === email) {
        return users[key].id;
      }
    }
  }

  const id = getID(users);
  if (emailDoesNotExist(users, email)) {
    res
      .status(403)
      .send("Your email address does not exist! Please register than login.");
  } else if (!bcrypt.compareSync(password, users[id].password)) {
    res.status(403).send("your email address or password is incorrect!");
  } else {
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];

  if (user) {
    let templateVars = { user: user };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];

  const newShort = generatedShort();
  urlDatabase[newShort] = {
    longURL: req.body.longURL,
    userID: user.id
  };
  console.log("urlDatabase", urlDatabase);
  res.redirect("/urls/" + newShort);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];

  if (urlObject) {
    res.redirect(urlObject.longURL);
  } else {
    res.status(404).send("Not found");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];

  if (user && urlObject.userID === user.id) {
    delete urlDatabase[shortURL];
  } else {
    res.status(401).send("You don't have permisson for this action.");
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];

  if (user && urlObject.userID === user.id) {
    let longURLUpdated = req.body.updatedLongURL;
    urlObject.longURL = longURLUpdated;
  } else {
    res.status(401).send("You don't have permisson for this action.");
  }
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];

  if (!urlObject) {
    res.status(404).send("Short URL not found.");
  } else if (user && urlObject.userID !== user.id) {
    res.status(401).send("You don't have permisson to view this page.");
  } else {
    let templateVars = {
      user: user,
      shortURL: shortURL,
      longURL: urlObject.longURL
    };
    res.render("urls_show", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
