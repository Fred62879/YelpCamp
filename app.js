var express    = require("express");
var bp         = require("body-parser");
var mongoose   = require("mongoose");
var seedDB     = require("./seeds");
var campground = require('./models/Campground');
var comment    = require('./models/comment');
var user       = require('./models/user');
var passport   = require('passport');
var pl         = require('passport-local');
var plm        = require('passport-local-mongoose');

mongoose.connect("mongodb://localhost:27017/campdb", {
    useNewUrlParser: true
});

var app = express();
app.set("view engine", "ejs");
app.use(bp.urlencoded({ extended:true }));
app.use(express.static(__dirname + "/public"));
app.use(require('express-session') ({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.currentuser = req.user;
    next();
});

passport.use(new pl(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
seedDB();


app.get("/", function(req, res) {
    // res.render("home");
    res.redirect("campgrounds");
});

// INDEX
app.get("/campgrounds", function(req, res) {
  campground.find({}, function(err, ret) {
    if (err) {
      console.log("err");
    } else {
      res.render("campgrounds", { campgrounds: ret });
    }
  });
});

// CREATE
app.post("/campgrounds", function(req, res) {
  var nm = req.body.name;
  var url = req.body.url;
  var desc = req.body.desc;

  var newcamp = { name:nm, image:url, desc:desc };
  campground.create(newcamp, function(err, ret) {
    if (err) {
      conosle.log("error adding new camp");
    } else {
      res.redirect("/campgrounds");
    }
  });
});

// NEW
app.get("/campgrounds/new", function(req, res) {
    res.render("new");
});

// SHOW
app.get("/campgrounds/:id", function(req, res) {
  campground.findById(req.params.id).populate('comments').exec(function(err, ret) {
    if (err) {
      console.log("info page error");
    } else {
      console.log(ret);
      res.render("show", { campground: ret });
    }
  });
});

// COMMENT GET
app.get("/campgrounds/:id/comment/new", isLoggedIn, (req, res) => {
  campground.findById(req.params.id, (err, camp) => {
    if (err) { console.log(err); }
    else {
      res.render('comment', { campground: camp });
    }
  });
});

app.post("/campgrounds/:id/comment", isLoggedIn, (req, res) => {
  campground.findById(req.params.id, (err, camp) => {
    if (err) {
      console.log(err);
    } else {
      comment.create(req.body.comment, (err, comm) => {
        if (err) {
          console.log(err);
        } else {
          camp.comments = camp.comments.concat([comm]);
          camp.save((err, camp) => {
            if (err) console.log(err);
            else {
              res.redirect("/campgrounds/" + camp._id);
            }
          });
        }
      });
    }
  });
});

app.get("/signup", (req, res) => {
    res.render("register");
});

app.post("/signup", (req, res) => {
    user.register(new user({ username: req.body.username }), req.body.password, (err, user) => {
	if (err) console.log(err);
	else {
	    passport.authenticate("local")(req, res, () => {
		res.redirect('/campgrounds');
	    });
	}
    });
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/campgrounds',
    failureRedirect: '/login'
}), (req, res) => {});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/campgrounds');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

app.listen(3000, function() {
    console.log("Server started!");
});
