// Moduli da richiedere
const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const cookieSession = require("cookie-session");

// Modelli da richiedere
const User = require("./models/user");
const Post = require("./models/post");
const Comment = require("./models/comment");
const Message = require("./models/message");

app.set("view engine", "ejs");

// MONGOOSE SETUP
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGODB_URI, function(){
    console.log("Database connesso!");
});

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// SET PUBLIC FOLDER
app.use(express.static(__dirname + "/public"));

// METHOD OVERRIDE SETUP
app.use(methodOverride("_method"));

app.use(cookieSession({
    name: 'session',
    secret: process.env.COOKIE_SECRET
}))

// CONNECT FLASH MESSAGES
app.use(flash());

// GLOBAL
app.use(function (req, res, next){
    res.locals.utente = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.get("/", function (req, res){
    Post.find({}, function(err, posts){
        if(err){
            console.log(err);
            res.status(400).send("Si è verificato un errore nel caricamento, mannaggia alla Peppina");
        } else {
            res.render("index", {posts: posts.reverse()});
        }
    });
})

app.get("/new", function(req, res){
    res.render("posts/new", {
        defaultImg: "/img/post/default.jpeg"
    })
})

app.post("/", function(req, res){
    var newPost = new Post({
        titolo: req.body.titolo,
        contenuto: req.body.contenuto,
        soloFermi: false,
        commenti: [],
        like: 0,
        dislike: 0,
        immagine: req.body.img
    });
    newPost.save(function(err){
        if(err){
            console.log(err);
            res.status(400).send("Si è verificato un errore nel salvataggio, mannaggia alla Peppina");
        } else {
            res.redirect("/");
        }
    });
})

const server = app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server partito!");
})