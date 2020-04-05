// Moduli da richiedere
const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const i18n = require("i18n-express");
var socket = require("socket.io");
const marked = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Models
const User = require("./models/user");
const Post = require("./models/post");
const Comment = require("./models/comment");
const Message = require("./models/message");

// Routes
const indexRoutes = require("./routes/index");
const courseRoutes = require("./routes/course");
const postRoutes = require("./routes/post");
const commentRoutes = require("./routes/comment");
const fileUploader = require("./routes/file-upload");
const fileDownloader = require("./routes/file-download");
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
app.use('/imgupload', imgUploader);
// ROUTES SET UP
app.use('/', indexRoutes);
app.use('/courses', courseRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

app.get("/info", function(req, res){
    res.render("info");
});

app.get("/test", function(req, res){
    res.render("tests/course-list");
});

// Common routes
app.get("/login", function(req, res){
    res.redirect("/auth/login");
});

app.get("/thankyou", function(req, res){
    res.render("thankyou");
});

app.get("*", function(req, res){
    res.status(404).send("Mannaggia alla Peppina, dove vuoi andare?");
});

const server = app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server partito!");
});

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

// Chat
io.on("connection", function(socket){
    Message.find({}).
    populate("autore").
    exec(function(err, messages){
        if(err){
            console.log(err);
            socket.emit("err", err);
        } else {
            socket.emit("pastMsg", messages);
        }
    });
    socket.on("chat", function(data){
        if(data.message.length > 120){
            socket.emit("error-msg", "Il messaggio era più lungo di 120 caratteri e non è stato inviato");
            return false;
        }
        let contenuto = DOMPurify.sanitize(marked(data.message, {breaks: true}), {ALLOWED_TAGS: [ 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe' ]});
        if(contenuto.length <= 0){
            socket.emit("error-msg", "Il messaggio era troppo corto e non è stato inviato");
            return false;
        }
        let messageObj = new Message({
            autore: socket.request.user._id,
            contenuto: contenuto,
            dataCreazione: Date.now()
        });
        
        if(data.username != socket.request.user.username){
            let newUsername = data.username;
            let oldUsername = socket.request.user.username;
            User.findByIdAndUpdate(socket.request.user._id, { username: data.username }, function(err, newUser){
                if(err){
                    console.log(err);
                    socket.emit("error", err);
                } else {
                    socket.emit("changeOwnUsername", newUsername);
                    io.sockets.emit("changeUsername", {
                        newUsername: newUsername,
                        oldUsername: oldUsername
                    });
                }
            });
        }
        messageObj.save(function(err){if(err){console.log(err);}});
        messageObj.populate("autore").execPopulate().then(function(populated){
            populated.autore.messaggi.push(messageObj._id);
            populated.autore.save(function(err){if(err){console.log(err);}});
        }, function(err){
            console.log("Error while populating user in messageObj");
            console.log(err);
        });
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
        io.sockets.emit("chat", {
            autore: data.username,
            contenuto: messageObj.contenuto,
            dataCreazione: messageObj.dataCreazione
        });
    });

    socket.on("typing", function(data){
        socket.broadcast.emit("typing", data);
    });

    socket.on("notyping", function(){
        socket.broadcast.emit("notyping");
    });

    socket.on("cancella", function(data){
        Message.findOneAndRemove({date: data}, function(err, deleted){
            if(err){
                console.log(err);
            } else {
                io.emit("cancella", deleted);
            }
        });
    });
});