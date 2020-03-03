const router = require('express').Router();
const Course = require("../models/course");
const User = require("../models/user");
const middleware = require("../middleware");

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
    })
})

router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("courses/new");
})

router.post("/", middleware.isLoggedIn, function(req, res){
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
            req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
            res.status(500).redirect("back");
            return false;
        }
        // DEBUG: fai controlli di validità (lunghezza)
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
            res.redirect("/courses/" + newCourse._id);
        });
    });
});

router.get("/:id", middleware.isLoggedIn, function(req, res){
    Course.findById(req.params.id).
    populate({ path: "contenuti", populate: { path: "autore", model: "User" } }).
    populate("amministratori").
    populate("partecipanti").
    exec(function(err, foundCourse){
        if(err){
            if(err.name == "CastError"){
                req.flash("error", `L'ID corso inserito (${req.params.id}) non è valido`);
                res.status(400).redirect("back");
            } else {
                console.log(err);
                req.flash("error", "Errore nel caricamento del corso");
                res.status(500).redirect("back");
            }
            return false;
        }
        User.findById(req.user.id).
        exec(function(err, foundUser){
            if(err){
                console.log(err);
                req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
                res.status(500).redirect("back");
                return false;
            }
            // DEBUG!!! CONTROLLA CHE NON SIA PUBBLICO
            if(isInCourse(foundCourse, foundUser)){
                if(req.query.showCode){
                    res.render("courses/view", { corso: foundCourse, mostraCodice: true, admin: checkAdmin(foundCourse, foundUser) });
                } else {
                    res.render("courses/view", { corso: foundCourse, admin: checkAdmin(foundCourse, foundUser) });
                }
            } else {
                req.flash("error", "Non sei iscritto al corso");
            }
        })
    })
});

function isInCourse(course, user){
    for(let i = 0; i < course.amministratori.length; i++){
        if(course.amministratori[i]._id.equals(user._id)){
            return true;
        }
    }
    return false;
}

function checkAdmin(course, user){
    for(let i = 0; i < course.partecipanti.length; i++){
        if(course.partecipanti[i]._id.equals(user._id)){
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
            for(let i = 0; i < courses.length; i++){
                if(courses[i].codice == req.body.codice.toUpperCase()){
                    await courses[i].partecipanti.push(foundUser._id);
                    await courses[i].save(function(err){if(err){console.log(err);}});
                    await foundUser.corsi.push(courses[i]._id);
                    await foundUser.save(function(err){if(err){console.log(err);}});
                    req.flash("success", `Ti sei iscritto al corso ${courses[i].titolo}!`)
                    res.redirect("/courses");
                    return true;
                }
            }
            req.flash("error", `Nessun corso trovato con il codice ${req.body.codice.toUpperCase()}`)
            res.redirect("/courses");
        })
    })
});

module.exports = router;