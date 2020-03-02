const router = require('express').Router();
const middleware = require("../middleware");
const User = require("../models/user");

let comuni = require("../public/json/comuni.json");
let province = require("../public/json/province.json");
let regioni = require("../public/json/regioni.json");

router.get('/', middleware.isLoggedIn, function(req, res){
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
                })
            } catch(err){
                console.log(err);
                req.flash("error", "Errore nel salvataggio delle nuove informazioni!");
                res.status(500).redirect("back");
            }
        }
    })
})

module.exports = router;