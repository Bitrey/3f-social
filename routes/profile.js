const router = require('express').Router();
const middleware = require("../middleware");
const User = require("../models/user");

router.get("/", middleware.isLoggedIn, function(req, res){
    res.render('profile/view', {
        residenzaJSON: JSON.stringify(req.user.residenza),
        immagineJSON: JSON.stringify(req.user.immagine)
    });
});

router.get('/edit', middleware.isLoggedIn, function(req, res){
    res.render('profile/edit', {
        residenzaJSON: JSON.stringify(req.user.residenza),
        immagineJSON: JSON.stringify(req.user.immagine)
    });
});

// Visualizza in nuova pagina
// Visualizza con modal usando AJAX
router.get("/:id", function(req, res){
    if(req.xhr){
        User.findById(req.query.id).
        populate("corsi").
        sort( {"corsi.dataCreazione": '-1'} ).
        exec(function(err, foundUser){
            if(err){
                console.log(err);
                res.status(500).send("Errore nella ricerca dell'utente");
                return false;
            }
            if(!foundUser){
                res.status(404).send("Utente non trovato");
                return false;
            }
            res.json(foundUser);
        })
        return false;
    }
    console.log("Ricevuta richiesta normale!");
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            console.log(err);
            req.flash("error", "Errore nella ricerca dell'utente.");
            res.status(500).redirect("back");
            return false;
        }
        if(!foundUser){
            req.flash("error", "Utente non trovato");
            res.status(404).redirect("back");
            return false;
        }
        res.render("profile/public", { utente: foundUser });
    });
});

router.put("/", middleware.isLoggedIn, function(req, res){
    User.findByIdAndUpdate(req.user.id, req.body.profile, function(err, updatedUser){
        if(err){
            console.log(err);
            req.flash("error", "Errore nel salvataggio delle nuove informazioni!");
            res.status(500).redirect("back");
        } else {
            try {
                updatedUser.residenza = JSON.parse(req.body.profile.residenza);
                updatedUser.immagine = JSON.parse(req.body.profile.img);
                updatedUser.save(function(err, saved){
                    if(err){
                        console.log(err);
                        req.flash("error", "Errore nel salvataggio delle nuove informazioni!");
                        res.status(500).redirect("back");
                    } else {
                        req.flash("success", "Informazioni profilo aggiornate");
                        res.redirect("/profile");
                    }
                });
            } catch(err){
                console.log(err);
                req.flash("error", "Errore nel salvataggio delle nuove informazioni!");
                res.status(500).redirect("back");
            }
        }
    });
});

module.exports = router;