const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");
const middleware = require("../middleware");

router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("posts/new");
})

router.post("/", middleware.isLoggedIn, function(req, res){
    let attachments = [];
    if(req.body.attachments){
        let parsedAttachments = JSON.parse(req.body.attachments);
        parsedAttachments.forEach(function(attachment){
            attachments.push({
                indirizzo: attachment.name,
                nome: attachment.originalName,
                dimensione: attachment.size,
                estensione: attachment.ext
            });
        });
    }
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            req.flash("Errore nella ricerca dell'utente. Hai un profilo buggato?");
            console.log(err);
            res.redirect("back");
        } else {
            var newPost = new Post({
                autore: {
                    id: req.user.id,
                    username: foundUser.username
                },
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
                    log.error(err);
                    res.status(400).send("Si è verificato un errore nel salvataggio, mannaggia alla Peppina");
                } else {
                    req.flash("success", "Nuovo post aggiunto!");
                    res.redirect("/");
                }
            });
        }
    })
})

// SHOW POST
router.get("/:id", function(req, res){
    Post.findById(req.params.id, function(err, post){
        if(err){
            req.flash("error", err.message);
            res.status(500).redirect("/");
        } else {
            if(post){
                res.render("posts/view", { post: post, utente: req.user });
            } else {
                req.flash("error", "Post non trovato");
                res.status(404).redirect("back");
            }
        }
    })
});

// EDIT POST
router.get("/:id/edit", function(req, res){
    Post.findById(req.params.id, function(err, foundPost){
        if(err){
            req.flash("error", err.message);
            console.log(err);
            res.status(500).redirect("back");
        } else {
            res.render("posts/edit", { post: foundPost });
        }
    })
})

// UPDATE POST
router.put("/:id", middleware.isPostOwner, function(req, res){
    Post.findByIdAndUpdate(req.params.id, req.body.post, function(err, updatedPost){
        if(err){
            req.flash("error", err.msg);
            console.log(err);
            res.status(500).redirect("back");
        } else {
            req.flash("success", "Post modificato con successo");
            res.redirect("/posts/" + req.params.id);
        }
    })
})

router.delete("/:id", middleware.isPostOwner, function(req, res){
    Post.findByIdAndDelete(req.params.id, function(err){
        if(err){
            req.flash("error", err.msg);
            console.log(err);
            res.status(500).redirect("back");
        } else {
            req.flash("success", "Post eliminato con successo");
            res.redirect("/");
        }
    })
})

module.exports = router;