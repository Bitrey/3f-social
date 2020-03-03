const router = require('express').Router();
const Course = require("../models/course");
const User = require("../models/user");
const middleware = require("../middleware");
const randomstring = require("randomstring");

router.get("/", middleware.isLoggedIn, function(req, res){
    User.findById(req.user.id).
    populate("corsi").
    exec(function(err, foundUser){
        if(err){
            console.log(err);
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
            console.log(err);
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
        let newCourse = new Course({
            amministratori: [ foundUser._id ],
            partecipanti: [ foundUser._id ],
            titolo: req.body.course.titolo,
            descrizione: req.body.course.descrizione,
            contenuti: [],
            pubblico: params.pubblico,
            chatGlobale: params.chatGlobale,
            chatPrivata: params.chatPrivata,
            immagine: JSON.parse(req.body.course.img)
        });
        newCourse.save(function(err, savedCourse){
            if(err){
                console.log(err);
                req.flash("error", "Errore nel salvataggio del nuovo corso");
                res.status(500).redirect("back");
                return false;
            }
            foundUser.corsi.push(newCourse._id);
            foundUser.save(function(err){if(err){console.log(err);}});
            req.flash("success", "Corso creato! Benvenuto nel tuo nuovo corso");
            res.redirect("/courses/" + newCourse._id);
        });
    });
});

router.get("/newcode", function(req, res){
    Course.findById(req.query.corso).
    exec(function(err, foundCourse){
        if(err){
            console.log(err);
            res.status(400).send("Errore nella ricerca del corso");
            return false;
        }
        if(foundCourse){
            foundCourse.codice = randomstring.generate({
                length: 9,
                readable: true,
                capitalization: "uppercase"
            });
            foundCourse.save(function(err, saved){
                if(err){
                    console.log(err);
                    res.status(500).send("Errore nel salvataggio del nuovo codice");
                    return false;
                }
                res.send(foundCourse.codice);
            });
        } else {
            res.status(400).send("Nessun corso trovato");
        }
    });
});

router.get("/:id", middleware.isLoggedIn, middleware.userInCourse, function(req, res){
    if(req.query.showCode){
        res.render("courses/view", { corso: req.course, mostraCodice: true, admin: checkAdmin(req.course, req.user) });
    } else {
        res.render("courses/view", { corso: req.course, admin: checkAdmin(req.course, req.user) });
    }
});

router.get("/:id/edit", middleware.isLoggedIn, middleware.userInCourse, function(req, res){
    if(!checkAdmin(req.course, req.user)){
        req.flash("error", "Non sei autorizzato");
        res.status(401).redirect("back");
        return false;
    }
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
            console.log(err);
            req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
            res.status(500).redirect("back");
            return false;
        }
        Course.find().
        exec(async function(err, courses){
            if(err){
                console.log(err);
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
                        await courses[i].save(function(err){if(err){console.log(err);}});
                        await foundUser.corsi.push(courses[i]._id);
                        await foundUser.save(function(err){if(err){console.log(err);}});
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

router.put("/:id", middleware.isLoggedIn, middleware.userInCourse, function(req, res){
    if(!checkAdmin(req.course, req.user)){
        res.send("Non sei autorizzato!");
        return false;
    }
    Course.findByIdAndUpdate(req.course._id, req.body.course, function(err, updatedCourse){
        if(err){
            console.log(err);
            req.flash("error", "Errore nel salvataggio della modifica del corso");
            res.status(500).redirect("back");
            return false;
        }
        updatedCourse.immagine = JSON.parse(req.body.course.img);
        updatedCourse.pubblico = setFromCheckboxValue(req.body.course.pubblico);
        updatedCourse.chatGlobale = setFromCheckboxValue(req.body.course.chatGlobale);
        updatedCourse.chatPrivata = setFromCheckboxValue(req.body.course.chatPrivata);
        updatedCourse.save(function(err, saved){
            if(err){
                console.log(err);
                req.flash("error", "Errore nel salvataggio dell'immagine nella modifica del corso");
                res.status(500).redirect("back");
                return false;
            }
            req.flash("success", "Corso modificato con successo");
            res.redirect("/courses/" + updatedCourse._id);
        });
    });
});

module.exports = router;