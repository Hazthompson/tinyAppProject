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

//Database to store generated shortURLs and their corresponding longURL
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

//Database of users and their information.
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

//function to generate an object of shortURLs and thier corresponding longURLS that
//only belong to a specific user (as user in taken in as a arguement)
function urlsForUser(userId) {
  let urlsObject = {};
  for (let shortURL in urlDatabase) {
    if (userId === urlDatabase[shortURL].userID) {
      urlsObject[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return urlsObject;
}

//function to generate random 6 character code for userID:
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

//funtion to check if email already exists in database (to redirect to login/registration)
function emailDoesNotExist(users, email) {
  for (var key in users) {
    if (users[key].email === email) {
      return false;
    }
  }
  return true;
}

//Homepage request:
app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//URLs in JSON format for for external source to have access to tinyURLs created.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Registration section:
app.get("/register", (req, res) => {
  res.render("urls_registration");
});

app.post("/register", (req, res) => {
  const id = generatedShort();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 12);

//check if email and password already exists in the system (if yes direct them to loging page)
// if not then new user and corresponding information is created and added to users Database
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


//login section:
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

//function to get which accepts user database and returns
//specifc user ID for the user logging in. We used this ID
//later to check email and password is correct
  function getID(users) {
    for (var key in users) {
      if (users[key].email === email) {
        return users[key].id;
      }
    }
  }

//check if email adress exists in system -
//if not direct to registration page. If yes then check the
//password is correct by verifying matching password to user ID stored in system.
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

//existing URL index page (individual for each user based on which the URLs each have created)
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


//to create new URLS. This needs to be defined/ordered before "/urls/:shortURL"
// so this route works.
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];

  if (user) {
    let templateVars = { user: user };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//redirect to longURL location (e.g. www.google.com) using shortURL ID.
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];

  if (urlObject) {
    res.redirect(urlObject.longURL);
  } else {
    res.status(404).send("Not found");
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

//logout section:
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//to delete previously created short URLs:
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

//to update long URL. keep short URL the same but change it to associate it with
// different longURL
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

//local port enabled.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
