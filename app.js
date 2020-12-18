const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const cors = require("cors");

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());

mongoose.connect("mongodb://localhost:27017/wikiDB", {useNewUrlParser: true, useUnifiedTopology: true});

const articleSchema = mongoose.Schema ({
  title: String,
  content: String
});

const Article = mongoose.model("Article", articleSchema);

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
    const newArticle = new Article ({
      title: req.body.title,
      content: req.body.content
    });
    newArticle.save(function(err) {
      if (!err) {
        res.send("Success");
      } else {
        res.send(err);
      }
    });
  })

  .delete(function(req, res) {
    Article.deleteMany({}, function(err) {
      if (!err) {
        res.send("Sucessfully deleted all articles");
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
      res.send("No articles matching that title was found.");
    }
  });
})
.put(function(req, res) {
  Article.findByIdAndUpdate(
    req.params.articleId,
    {title: req.body.title, content: req.body.content},
    {overwrite: true},
    function(err) {
      if (!err) {
        res.send("Successfully updated the article.")
      } else {
        res.send(err);
      }
    });
})
.patch(function(req, res) {
  Article.findByIdAndUpdate(
    req.params.articleId,
    {$set: req.body},
    function(err) {
      if (!err) {
        res.send("Successfully updated article.");
      } else {
        res.send(err);
      }
    });
})
.delete(function(req, res) {
  Article.findByIdAndDelete(req.params.articleId, function(err) {
    if (!err) {
      res.send("Successfully deleted article.");
    } else {
      res.send(err);
    }
  });
});

app.listen(9000, function() {
  console.log("Server started on port 9000");
});
