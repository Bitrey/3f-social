// Moduli da richiedere
const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const i18n = require("i18n-express");
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
let socket = require("socket.io");

// Models
const Attachment = require("./models/attachment");
const Image = require("./models/image");

// Routes
const indexRoutes = require("./routes/index");
const postRoutes = require("./routes/post");
const commentRoutes = require("./routes/comment");
const fileUploader = require("./routes/file-upload");
const fileDownloader = require("./routes/file-download");
const fileDelete = require("./routes/file-delete");
const imgUploader = require("./routes/img-upload");

// Middleware
const middleware = require("./middleware");

// Auth
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');
const passportSocketIo = require("passport.socketio");
const passport = require('passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const passportSetup = require('./config/passport-setup');

app.set("view engine", "ejs");

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// SETUP COOKIE PARSER
app.use(cookieParser(process.env.COOKIE_SECRET));

// MONGOOSE SETUP
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGODB_URI, function(){
    console.log("Database connesso!");
});

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

// CONNECT FLASH MESSAGES
app.use(flash());

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(
    i18n({
        translationsPath: __dirname + '/locales',
        cookieLangName: "lang",
        paramLangName: "lang",
        siteLangs: ["en","it"],
        textsVarName: 'text'
    })
);

// GLOBAL
app.use(function(req, res, next){
    res.locals.utente = req.user;
    res.locals.error = req.flash("error");
    res.locals.warn = req.flash("warn");
    res.locals.info = req.flash("info");
    res.locals.success = req.flash("success");
    i18n({
        translationsPath: __dirname + '/locales',
        cookieLangName: "lang",
        paramLangName: "lang",
        siteLangs: ["en","it"],
        textsVarName: 'text'
    });
    next();
});

// METHOD OVERRIDE SETUP
app.use(methodOverride("_method"));

// SET PUBLIC FOLDER
app.use(express.static(__dirname + "/public"));

// Upload and download attachments
app.use('/fileupload', fileUploader);
app.use('/filedownload', fileDownloader);
app.use('/filedelete', fileDelete);
app.use('/imgupload', imgUploader);
// ROUTES SET UP
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

app.get("/info", function(req, res){
    res.render("info");
});

// Common routes
app.get("/login", function(req, res){
    res.redirect("/auth/login");
});

app.get("/thankyou", function(req, res){
    res.render("thankyou");
});

// Delete unused attachments
let fileDeleteSchedule = schedule.scheduleJob("00 * * * *", function(){
    try {
        const directoryPath = path.join(__dirname, 'uploads');
        fs.readdir(directoryPath, function(err, files){
            if(err){
                return console.error('Unable to scan directory: ' + err);
            }
        
            Attachment.find({}, function(err, foundAttachments){
                if(err){
                    return console.error(err);
                }
                
                let attachments = foundAttachments.map(x => x.indirizzo);
        
                files.forEach(function(file){
                    if(attachments.indexOf(file) < 0){
                        fs.unlink(path.join(directoryPath, file), function(err){
                            if(err){
                                return console.error(err);
                            };
                        });
                    }
                });
            });
        });
    } catch(err){
        console.log("Impossibile pulire la cartella uploads/");
        console.error(err);
    }
});

// Delete unused images
let imageDeleteSchedule = schedule.scheduleJob("00 * * * *", function(){
    try {
        const directoryPath = path.join(__dirname, 'public', 'uploads');
        fs.readdir(directoryPath, function(err, files){
            if(err){
                return console.error('Unable to scan directory: ' + err);
            }

            Image.find({ tipo: "local" }, function(err, foundImages){
                if(err){
                    return console.error(err);
                }

                // Sintassi dell'indirizzo di un'immagine: "/uploads/default.jpg"
                // Prendi solo l'ultimo
                let images = foundImages.map(x => x.indirizzo);

                files.forEach(function(file){
                    if(images.indexOf(file) < 0 && file != "default.jpg" && file != "user.png"){
                        fs.unlink(path.join(directoryPath, file), function(err){
                            if(err){
                                return console.error(err);
                            };
                        });
                    }
                });
            });
        });
    } catch(err){
        console.log("Impossibile pulire la cartella uploads/");
        console.error(err);
    }
});


const server = app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server partito!");
});

let io = socket(server);

io.use(passportSocketIo.authorize({
    cookieParser: cookieParser, //optional your cookie-parser middleware function. Defaults to require('cookie-parser')
    key: "connect.sid",       //make sure is the same as in your session settings in app.js
    secret: process.env.COOKIE_SECRET,      //make sure is the same as in your session settings in app.js
    store: mongoStore,        //you need to use the same sessionStore you defined in the app.use(session({... in app.js
    success: onAuthorizeSuccess,  // *optional* callback on success
    fail: onAuthorizeFail,     // *optional* callback on fail/error
}));

function onAuthorizeSuccess(data, accept){
    accept();
}

function onAuthorizeFail(data, message, error, accept){
    // error indicates whether the fail is due to an error or just a unauthorized client
    if(error){
        data.socket.emit("error", message);
        console.log(`\n${new Error().stack}\nMotivo: ${message}\n`);
    } else {
        // reject socket connection
        return accept(new Error(message));
    }
}

module.exports = { io: io }
const courseRoutes = require("./routes/course");
app.use('/courses', courseRoutes);

app.get("*", function(req, res){
    res.status(404).send("Dove vuoi andare?");
});