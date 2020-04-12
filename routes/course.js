const router = require('express').Router();
const Course = require("../models/course");
const User = require("../models/user");
const Image = require("../models/image");
const middleware = require("../middleware");
const randomstring = require("randomstring");
const Message = require("../models/message");
const io = require("../app.js").io;
const marked = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

router.get("/", middleware.isLoggedIn, function(req, res){
    User.findById(req.user.id).
    populate({ path: "corsi", populate: { path: "immagine", model: "Image" } }).
    populate("immagine").
    exec(function(err, foundUser){
        if(err){
            console.error(err);
            req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
            res.status(500).redirect("back");
        } else {
            res.render("courses/list", { corsi: foundUser.corsi });
        }
    });
});

router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("courses/new");
});

router.post("/", middleware.isLoggedIn, function(req, res){
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.error(err);
            req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
            res.status(500).redirect("back");
            return false;
        }
        // DEBUG: fai controlli di validità (lunghezza);
        let params = {};
        if(req.body.course.descrizione > 0){
            params.descrizione = req.body.course.descrizione;
        }
        params.pubblico = setFromCheckboxValue(req.body.course.pubblico);
        params.chatGlobale = setFromCheckboxValue(req.body.course.chatGlobale);
        params.chatPrivata = setFromCheckboxValue(req.body.course.chatPrivata);
        let image = new Image(JSON.parse(req.body.course.img));
        let newCourse = new Course({
            amministratori: [ foundUser._id ],
            partecipanti: [ foundUser._id ],
            titolo: req.body.course.titolo,
            descrizione: req.body.course.descrizione,
            contenuti: [],
            stanzaSocket: randomstring.generate(),
            pubblico: params.pubblico,
            chatGlobale: params.chatGlobale,
            chatPrivata: params.chatPrivata,
            immagine: image._id
        });
        image.documento = newCourse._id;
        image.modello = "Course";
        image.save();
        newCourse.save(function(err, savedCourse){
            if(err){
                console.error(err);
                req.flash("error", "Errore nel salvataggio del nuovo corso");
                res.status(500).redirect("back");
                return false;
            }
            foundUser.corsi.push(newCourse._id);
            foundUser.save(function(err){if(err){console.error(err);}});
            req.flash("success", "Corso creato! Benvenuto nel tuo nuovo corso");
            res.redirect("/courses/" + newCourse._id);
        });
    });
});

function getNewCourseCode(callback){
    let code = randomstring.generate({
        length: 9,
        readable: true,
        capitalization: "uppercase"
    });
    Course.find({}, function(err, foundCourses){
        if(err){
            console.error(err);
            res.status(400).send("Errore nella ricerca del corso");
            return false;
        } else if(!foundCourses){
            res.status(500).send("Errore nel controllo del nuovo codice");
        } else {
            foundCourses.forEach(function(course){
                if(course.codice == code){
                    getNewCourseCode(callback);
                    return false;
                }
            });
            callback(code);
        }
    });
}

router.get("/newcode", function(req, res){
    Course.findById(req.query.corso).
    exec(function(err, foundCourse){
        if(err){
            console.error(err);
            res.status(400).send("Errore nella ricerca del corso");
            return false;
        }
        if(foundCourse){
            getNewCourseCode(function(code){
                foundCourse.codice = code;
                foundCourse.save(function(err, saved){
                    if(err){
                        console.error(err);
                        res.status(500).send("Errore nel salvataggio del nuovo codice");
                        return false;
                    }
                    res.send(foundCourse.codice);
                });
            });
        } else {
            res.status(404).send("Nessun corso trovato");
        }
    });
});

router.get("/:id", middleware.isLoggedIn, middleware.userInCourse, async function(req, res){
    res.render("courses/view", { corso: req.course, hideHome: true, admin: checkAdmin(req.course, req.user) });
});

router.get("/:id/edit", middleware.isLoggedIn, middleware.userInCourse, async function(req, res){
    if(!checkAdmin(req.course, req.user)){
        req.flash("error", "Non sei autorizzato");
        res.status(401).redirect("back");
        return false;
    }
    await req.course.populate("immagine").execPopulate();
    res.render("courses/edit", { corso: req.course, corsoJSON: JSON.stringify(req.course) });
});

function checkAdmin(course, user){
    for(let i = 0; i < course.amministratori.length; i++){
        if(course.amministratori[i].equals(user._id)){
            return true;
        }
    }
    return false;
}

function setFromCheckboxValue(value){
    if(value){
        return true;
    } else {
        return false;
    }
}

router.post("/join", middleware.isLoggedIn, async function(req, res){
    User.findById(req.user.id).
    exec(async function(err, foundUser){
        if(err){
            console.error(err);
            req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
            res.status(500).redirect("back");
            return false;
        }
        Course.find().
        exec(async function(err, courses){
            if(err){
                console.error(err);
                req.flash("error", "Errore nella ricerca dei corsi");
                res.status(500).redirect("back");
                return false;
            }
            // Trova corso
            for(let i = 0; i < courses.length; i++){
                if(courses[i].codice == req.body.codice.toUpperCase()){
                    let canJoinCourse = false;
                    // Controlla che non sia già partecipante
                    // DEBUG!!! CONTROLLA SE PUBBLICO (RICHIESTE)
                    await courses[i].partecipanti.forEach(function(partecipante){
                        if(partecipante.equals(foundUser._id)){
                            canJoinCourse = true;
                            req.flash("error", `Fai già parte del corso ${courses[i].titolo}`);
                            res.redirect("/courses#" + courses[i]._id);
                            return false;
                        }
                    });
                    if(!canJoinCourse){
                        await courses[i].partecipanti.push(foundUser._id);
                        await courses[i].save(function(err){if(err){console.error(err);}});
                        await foundUser.corsi.push(courses[i]._id);
                        await foundUser.save(function(err){if(err){console.error(err);}});
                        req.flash("success", `Ti sei iscritto al corso ${courses[i].titolo}!`);
                        res.redirect("/courses#" + courses[i]._id);
                        return true;
                    }
                }
            }
            req.flash("error", `Nessun corso trovato con il codice ${req.body.codice.toUpperCase()}`);
            res.redirect("/courses");
        });
    });
});

router.put("/:id", middleware.isLoggedIn, middleware.userInCourse, async function(req, res){
    if(!checkAdmin(req.course, req.user)){
        res.send("Non sei autorizzato!");
        return false;
    }
    Course.findByIdAndUpdate(req.course._id, req.body.course, async function(err, updatedCourse){
        if(err){
            console.error(err);
            req.flash("error", "Errore nel salvataggio della modifica del corso");
            res.status(500).redirect("back");
            return false;
        }
        await updatedCourse.populate("immagine").execPopulate();

        let imageReq = JSON.parse(req.body.course.img);
        updatedCourse.immagine.tipo = imageReq.tipo;
        updatedCourse.immagine.indirizzo = imageReq.indirizzo;
        updatedCourse.immagine.modello = "Course";
        updatedCourse.immagine.documento = updatedCourse._id;
        updatedCourse.immagine.save(function(err){
            if(err){
                console.error(err);
                req.flash("error", "Errore nel salvataggio dell'immagine nella modifica del corso");
                res.status(500).redirect("back");
                return false;
            }
        });

        updatedCourse.pubblico = setFromCheckboxValue(req.body.course.pubblico);
        updatedCourse.chatGlobale = setFromCheckboxValue(req.body.course.chatGlobale);
        updatedCourse.chatPrivata = setFromCheckboxValue(req.body.course.chatPrivata);
        updatedCourse.save(function(err, saved){
            if(err){
                console.error(err);
                req.flash("error", "Errore nel salvataggio dell'immagine nella modifica del corso");
                res.status(500).redirect("back");
                return false;
            }
            req.flash("success", "Corso modificato con successo");
            res.redirect("/courses/" + updatedCourse._id);
        });
    });
});

router.delete("/:course", middleware.isCourseAdmin, async function(req, res){
    Course.findById(req.params.course).
    exec(async function(err, foundCourse){
        if(err){
            console.error(err);
            req.flash("error", "Errore nella ricerca del Course");
            res.status(500).redirect("back");
        } else {
            if(foundCourse){
                foundCourse.deleteOne(function(err){
                    if(err){
                        console.error(err);
                        req.flash("error", "Errore nell'eliminazione del corso");
                        res.status(500).redirect("back");
                        return false;
                    } else {
                        req.flash("success", "Corso eliminato con successo");
                        res.redirect("/courses");
                    }
                });
            } else {
                req.flash("error", "Nessun corso trovato");
                res.status(404).redirect("back");
            }
        }
    });
});

function findCourseAndCheckUserSocket(id, socket, callback){
    Course.findById(id).
    exec(function(err, foundCourse){
        if(err){
            console.error(err);
            socket.emit("error", err);
            return false;
        } else if(!foundCourse){
            socket.emit("error", "Corso non trovato");
            return false;
        }
        let foundCourseFlag = false;
        foundCourse.partecipanti.forEach(function(partecipante){
            if(partecipante.equals(socket.request.user._id)){
                foundCourseFlag = true;
                return false;
            }
        });
        if(!foundCourseFlag){
            socket.emit("error", "Non sei un partecipante del corso");
            return false;
        }
        callback(foundCourse);
    });
}

const chat = io.of('/chat');
// Chat
chat.on("connection", function(socket){
    // socket.join("prova");
    // console.log(socket.rooms);
    socket.on("chat", function(data){
        try {
            findCourseAndCheckUserSocket(data.corsoId, socket, function(foundCourse){
                let room = socket.rooms[Object.keys(socket.rooms)[0]];
                // console.log(room);
                if(data.message.length > 120){
                    socket.emit("error-msg", "Il messaggio era più lungo di 120 caratteri e non è stato inviato");
                    return false;
                }
                let contenuto = DOMPurify.sanitize(marked(data.message, {breaks: true}), {ALLOWED_TAGS: [ 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
                'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
                'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe' ]});
                if(contenuto.length <= 0 || contenuto.length > 150){
                    socket.emit("error-msg", "Il messaggio deve avere tra 1 e 150 caratteri!");
                    return false;
                }
                let messageObj = new Message({
                    destinatario: {
                        adUtente: false,
                        corso: foundCourse._id
                    },
                    mittente: socket.request.user._id,
                    contenuto: contenuto,
                    dataCreazione: Date.now()
                });
                
                if(data.username != socket.request.user.username){
                    let newUsername = data.username;
                    let oldUsername = socket.request.user.username;
                    User.findByIdAndUpdate(socket.request.user._id, { username: data.username }, function(err, newUser){
                        if(err){
                            console.error(err);
                            socket.emit("error", err);
                        } else {
                            socket.emit("changeOwnUsername", newUsername);
                            chat.emit("changeUsername", {
                                newUsername: newUsername,
                                oldUsername: oldUsername
                            });
                        }
                    });
                }
                messageObj.save(function(err){if(err){console.error(err);}});
                messageObj.populate("mittente").execPopulate().then(function(populated){
                    populated.mittente.messaggi.push(messageObj._id);
                    populated.mittente.save(function(err){if(err){console.error(err);}});
                }, function(err){
                    if(err){
                        console.log("Error while populating user in messageObj");
                        console.error(err);
                    }
                });
                if(!messageObj.destinatario.adUtente){
                    foundCourse.messaggi.push(messageObj._id);
                    foundCourse.save(function(err){
                        if(err){
                            console.log("Error while saving message in foundCourse");
                            console.error(err);
                        }
                    });
                }
                Message.find({}).sort('-dataCreazione').exec(function(err, foundMessages){
                    if(err){
                        console.error(err);
                    } else {
                        // Rimuovi i documenti prima di 100 messaggi
                        if(foundMessages.length > 100){
                            for(var i = 100; i < foundMessages.length; i++){
                                foundMessages[i].remove();
                            }
                        }
                    }
                });
                chat.to(room).emit("chat", {
                    idProfilo: socket.request.user._id,
                    mittente: data.username,
                    contenuto: messageObj.contenuto,
                    dataCreazione: messageObj.dataCreazione
                });
            });
        } catch(e){
            socket.emit("error", e);
        }
    });

    socket.on("typing", function(data){
        let room = socket.rooms[Object.keys(socket.rooms)[0]];
        socket.broadcast.to(room).emit("typing", data);
    });

    socket.on("notyping", function(){
        let room = socket.rooms[Object.keys(socket.rooms)[0]];
        socket.broadcast.to(room).emit("notyping");
    });

    socket.on("cancella", function(data){
        let room = socket.rooms[Object.keys(socket.rooms)[0]];
        Message.findOneAndRemove({date: data}, function(err, deleted){
            if(err){
                console.error(err);
            } else {
                chat.to(room).emit("cancella", deleted);
            }
        });
    });

    socket.on("joinRoom", function(data){
        // console.log(`Il socket ${socket.id} vuole entrare nella stanza del corso ${data.corsoId}`);
        if(!socket.request.user && !socket.request.user._id){
            socket.emit("error", "Errore nella ricerca del tuo profilo, prova a riloggare");
        }
        findCourseAndCheckUserSocket(data.corsoId, socket, function(foundCourse){
            socket.leave(socket.id);
            socket.join(foundCourse.stanzaSocket);
            foundCourse.populate({
                path: 'messaggi',			
                populate: { path: 'mittente', model: 'User' }
              }).execPopulate().then(function(populatedCourse){
                socket.emit("pastMsg", populatedCourse.messaggi);
            });
        });
    });
});

module.exports = router;