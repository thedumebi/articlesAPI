require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cors());
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/wikiDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const articleSchema = mongoose.Schema({
  title: String,
  content: String
});

const Article = mongoose.model("Article", articleSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  articles: articleSchema
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//////////////Request Targetting all articles/////////////////

app.route("/articles")
  .get(function(req, res) {
    Article.find(function(err, foundArticles) {
      if (!err) {
        res.send(foundArticles);
      } else {
        res.send(err);
      }
    });
  })

  .post(function(req, res) {
    const newArticle = new Article({
      title: req.body.title,
      content: req.body.content
    });
    newArticle.save(function(err) {
      if (!err) {
        res.send({status: "Successfully saved"});
      } else {
        res.send(err);
      }
    });
  })

  .delete(function(req, res) {
    Article.deleteMany({}, function(err) {
      if (!err) {
        res.send({status: "Successfully Deleted"});
      } else {
        res.send(err);
      }
    });
  });

//////////////Request Targetting A Specific Article/////////////////

app.route("/articles/:articleId")
  .get(function(req, res) {
    Article.findById(req.params.articleId, function(err, foundArticle) {
      if (foundArticle) {
        res.send(foundArticle);
      } else {
        res.send({err: "No articles matching that title was found."});
      }
    });
  })
  .put(function(req, res) {
    Article.findByIdAndUpdate(
      req.params.articleId, {
        title: req.body.title,
        content: req.body.content
      }, {
        overwrite: true
      },
      function(err) {
        if (!err) {
          res.send({status: "Successfully updated the article."});
        } else {
          res.send(err);
        }
      });
  })
  .patch(function(req, res) {
    Article.findByIdAndUpdate(
      req.params.articleId, {
        $set: req.body
      },
      function(err) {
        if (!err) {
          res.send({status: "Successfully updated the article."});
        } else {
          res.send(err);
        }
      });
  })
  .delete(function(req, res) {
    Article.findByIdAndDelete(req.params.articleId, function(err) {
      if (!err) {
        res.send({status: "Successfully Deleted"});
      } else {
        res.send(err);
      }
    });
  });

app.post("/login", function(req, res) {
  passport.authenticate("local", (err, user, info) => {
    console.log("user", user);
    console.log("info", info);
    if (err) {return err}
    if (!user) {return res.send("failure")}
    req.login(user, function(err) {
      if (err) {console.log(err);}
      console.log(res.status);
      return res.status(200).json({authenticated: true})
    });
  })(req, res);
  // console.log(req.body);
  //   const user = new User({
  //     username: req.body.email,
  //     password: req.body.password
  //   });
  //   console.log(user);
  //   req.login(user, function(err) {
  //     if (err) {
  //       alert(err)
  //     } else {
  //       passport.authenticate("local")(req, res, function() {
  //         const authenticated = Boolean(typeof req.user !== "undefined");
  //         console.log(authenticated);
  //         res.status(200).json({
  //           authenticated
  //         });
  //       });
  //     }
  //   });
  });

app.route("/register")
  .post(function(req, res) {
    req.body.password === req.body.cpassword ?
      User.register({username: req.body.email}, req.body.password, function(err, user) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          passport.authenticate("local", function(req, res) {
            console.log("x", req.user);
            res.send("Success");
          });
        }
      }) : res.send("failure");
  });

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.listen(9000, function() {
  console.log("Server started on port 9000");
});
