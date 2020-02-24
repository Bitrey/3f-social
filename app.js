// Moduli da richiedere
const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
var socket = require("socket.io");

// Routes
const User = require("./models/user");
const Post = require("./models/post");
const Comment = require("./models/comment");
const Message = require("./models/message");
const fileUploader = require("./routes/file-upload");
const fileDownloader = require("./routes/file-download");
const postRoutes = require("./routes/post-routes");
const imgUploader = require("./routes/img-upload");

// Middleware
const middleware = require("./middleware/index");

// Auth
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');
const passportSocketIo = require("passport.socketio");
const passport = require('passport');
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');

app.set("view engine", "ejs");

// SETUP COOKIE PARSER
app.use(cookieParser(process.env.COOKIE_SECRET));

// SETUP MONGOSTORE
mongoStore = new MongoStore({
    url: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
});

// SETUP EXPRESS SESSION
app.use(session({
    key: "connect.sid",
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {},
    store: mongoStore
}));

// Upload and download attachments
app.use('/fileupload', fileUploader);
app.use('/filedownload', fileDownloader);
app.use('/imgupload', imgUploader);

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
app.use('/post', postRoutes);

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
    res.render("posts/new");
})

app.post("/", middleware.isLoggedIn, function(req, res){
    let parsedAttachments = JSON.parse(req.body.attachments);
    let attachments = [];
    parsedAttachments.forEach(function(attachment){
        attachments.push({
            indirizzo: attachment.name,
            nome: attachment.originalName,
            dimensione: attachment.size,
            estensione: attachment.ext
        });
    })
    var newPost = new Post({
        idAutore: req.user.id,
        titolo: req.body.titolo,
        contenuto: req.body.contenuto,
        soloFermi: false,
        commenti: [],
        like: 0,
        dislike: 0,
        immagine: JSON.parse(req.body.img),
        allegati: attachments
    });
    newPost.save(function(err, newPost){
        if(err){
            console.log(err);
            res.status(400).send("Si è verificato un errore nel salvataggio, mannaggia alla Peppina");
        } else {
            console.log("Salvato nuovo post:");
            console.log(newPost);
            res.redirect("/");
        }
    });
})

app.get("/info", function(req, res){
    res.render("info");
})

app.get("*", function(req, res){
    res.status(404).send("Mannaggia alla Peppina, dove vuoi andare?");
})

const server = app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server partito!");
})

// Socket setup
var io = socket(server);

io.use(passportSocketIo.authorize({
    cookieParser: cookieParser, //optional your cookie-parser middleware function. Defaults to require('cookie-parser')
    key: "connect.sid",       //make sure is the same as in your session settings in app.js
    secret: process.env.COOKIE_SECRET,      //make sure is the same as in your session settings in app.js
    store: mongoStore,        //you need to use the same sessionStore you defined in the app.use(session({... in app.js
    success: onAuthorizeSuccess,  // *optional* callback on success
    fail: onAuthorizeFail,     // *optional* callback on fail/error
}));

function onAuthorizeSuccess(data, accept){
    // console.log('Nuova connessione accettata, sessione: ' + data.sessionID);
    accept();
}

function onAuthorizeFail(data, message, error, accept){
    // error indicates whether the fail is due to an error or just a unauthorized client
    if(error){
        console.log(`\n${new Error().stack}\nMotivo: ${message}\n`);
    } else {
        // reject socket connection
        return accept(new Error(message));
    }
}

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
            idAutore: socket.request.user._id,
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