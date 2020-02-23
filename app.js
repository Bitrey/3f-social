// Moduli da richiedere
const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
var socket = require("socket.io");

// Modelli da richiedere
const User = require("./models/user");
const Post = require("./models/post");
const Comment = require("./models/comment");
const Message = require("./models/message");
var fileUploader = require("./routes/file-upload");

// Auth
const cookieSession = require('cookie-session');
const passport = require('passport');
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');

app.set("view engine", "ejs");

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_SECRET]
}))

app.use('/fileupload',fileUploader)

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

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

// ROUTES SET UP
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// CONNECT FLASH MESSAGES
app.use(flash());

// GLOBAL
app.use(function(req, res, next){
    res.locals.utente = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.get("/", function(req, res){
    Post.find({}, function(err, posts){
        if(err){
            console.log(err);
            res.status(400).send("Si è verificato un errore nel caricamento, mannaggia alla Peppina");
        } else {
            res.render("index", { posts: posts.reverse() });
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
        immagine: req.body.img,
        allegati: []
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

app.get("/info", function(req, res){
    res.render("info");
})

const server = app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server partito!");
})

// Socket setup
var io = socket(server);

io.on("connection", function(socket){
    Message.find({}, function(err, messages){
        if(err){
            socket.emit("err", err);
        } else {
            socket.emit("pastMsg", messages);
        }
    });
    socket.on("chat", function(data){
        // DEBUG: !!! RISOLVI AD AUTORE DA PRENDERE DA USER PASSPORT AUTHENTICATION
        let messageObj = new Message({
            usernameAutore: data.username,
            idAutore: data.id,
            contenuto: data.message,
            dataCreazione: Date.now()
        });
        messageObj.save(function(err){if(err){console.log(err);}});
        Message.find({}).sort('-dataCreazione').exec(function(err, foundMessages){
            if(err){
                console.log(err);
            } else {
                // Rimuovi i documenti prima di 100 messaggi
                if(foundMessages.length > 100){
                    for(var i = 100; i < foundMessages.length; i++){
                        foundMessages[i].remove();
                    }
                }
            }
        });
        io.sockets.emit("chat", messageObj);
    });

    socket.on("typing", function(data){
        socket.broadcast.emit("typing", data);
    })

    socket.on("notyping", function(){
        socket.broadcast.emit("notyping");
    })

    socket.on("cancella", function(data){
        Message.findOneAndRemove({date: data}, function(err, deleted){
            if(err){
                console.log(err);
            } else {
                io.emit("cancella", deleted);
            }
        });
    })
});