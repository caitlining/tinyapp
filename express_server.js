const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

/* Generates a random string, used for creating short URLs and userIDs */
const generateRandomString = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    randomString += randomChar;
  }
  return randomString;
};
/* Checks if submitted email from registration form already exists in user database */
const emailAlreadyExists = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user].id
    }
  } return false;
};
/* Returns an object of URLs specific to the argument userID */
const urlsForUser = function(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  } 
  return userUrls;
};

/* Object with all Long URLs and their corresponding short URLS. */
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID"},
};

/* Object with all user data */
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

/* Responds to '/urls' GET request with rendered HTML of urls_index.ejs. */
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies["user_id"]),
    user: users[req.cookies["user_id"]],
  };
  res.render('urls_index', templateVars);
});

/* Responds to '/urls/new' GET request 
- if user is logged in, responds with rendered HTML of urls_new.ejs 
- if user is not logged, redirects to 'login'*/
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_login", templateVars);
});

/* Responds to '/urls/:shortURL' GET request with rendered HTML of urls_show.ejs with data specific to :shortURL */
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    urlUserID: urlDatabase[req.params.shortURL].userID,
    user: users[req.cookies["user_id"]],
  };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

/* Responds to '/u/:shortURL' GET request by redirecting to the corresponding long URL, from the urlDatabase */
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL === undefined) {
    res.send(302);
  } else {
    res.redirect(longURL);
  }
});

app.post("/register", (req, res) => {
  const submittedEmail = req.body.email;
  const submittedPassword = req.body.password;

  if (!submittedEmail || !submittedPassword) {
    res.send(400, "Please include both a valid email and password");
  } else if (emailAlreadyExists(submittedEmail)) {
    res.send(400, "An account already exists for this email address");
  } else {
    const newUserID = generateRandomString();
    users[newUserID] = {
      id: newUserID,
      email: submittedEmail,
      password: submittedPassword
    };
      res.cookie('user_id', newUserID);
      res.redirect("/urls");
  };
});

/* Responds to '/urls' POST request with a redirect to 'urls/${shortURL}', using the shortURL that was generated by the request */
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

/* Responds to '/urls/:shortURL/delete' POST request by deleting :shortURL in database, redirects to main '/urls' page */
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

/* Reponds to '/urls/:id' POST request by saving the newURL from the request input in the database, and redirecting to '/urls' */
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.newURL;
  res.redirect('/urls');
});

/* Responds to '/login' POST request by creating a cookie with the request input user_id, and redirecting to '/urls' */
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!emailAlreadyExists(email)) {
    res.send(403, "There is no account associated with this email address");
  } else {
    const userID = emailAlreadyExists(email);
    if (users[userID].password !== password) {
      res.send(403, "The password you entered does not match the one associated with the provided email address");
    } else {
      res.cookie('user_id', userID);
      res.redirect("/urls");
    }
  }
});

/* Responds to '/logout' POST request by removing the cookie of the logged in user, and redirecting to '/urls' */
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


