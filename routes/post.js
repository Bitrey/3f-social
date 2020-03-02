const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");
const Attachment = require("../models/attachment");
const middleware = require("../middleware");

router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("posts/new");
})

router.post("/", middleware.isLoggedIn, async function(req, res){
    User.findById(req.user.id, async function(err, foundUser){
        if(err){
            req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
            console.log(err);
            res.redirect("back");
        } else {
            // Crea nuovo post
            let newPost = new Post({
                autore: foundUser._id,
                titolo: req.body.titolo,
                contenuto: req.body.contenuto,
                soloFermi: false,
                commenti: [],
                like: 0,
                dislike: 0,
                immagine: JSON.parse(req.body.img),
                allegati: []
            });
            if(req.body.attachments){
                let parsedAttachments = JSON.parse(req.body.attachments);
                await parsedAttachments.forEach(async function(attachment){
                    attachment = new Attachment({
                        proprietario: foundUser._id,
                        post: newPost._id,
                        indirizzo: attachment.name,
                        nome: attachment.originalName,
                        dimensione: attachment.size,
                        estensione: attachment.ext
                    });
                    // Salva nuovo allegato
                    await attachment.save(function(err, saved){if(err){console.log(err);}});
                    // Aggiungi e salva nuovo allegato all'utente
                    await foundUser.allegati.push(attachment._id);
                    await foundUser.save(function(err){if(err){console.log(err);}});
                    // Aggiungi nuovo allegato al post
                    await newPost.allegati.push(attachment._id);
                });
            }
            // Salva il post
            newPost.save(function(err, savedPost){
                if(err){
                    console.log(err);
                    req.flash("error", "Si è verificato un errore nel salvataggio, mannaggia alla Peppina");
                    res.status(500).redirect("back");
                } else {
                    req.flash("success", "Nuovo post aggiunto!");
                    res.redirect("/posts/" + savedPost._id);
                }
            });
        }
    })
})

// SHOW POST
router.get("/:id", function(req, res){
    Post.findById(req.params.id).
    populate("commenti").
    populate("autore").
    populate("allegati").
    exec(function(err, post){
        if(err){
            req.flash("error", err.message);
            res.status(500).redirect("/");
        } else {
            if(post){
                res.render("posts/view", { post: post, contenutoJSON: JSON.stringify(post.contenuto) });
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
            res.render("posts/edit", { post: foundPost, postJSON: JSON.stringify(foundPost) });
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
            updatedPost.immagine = JSON.parse(req.body.post.img);
            if(req.body.post.attachments){
                let attachments = [];
                let parsedAttachments = JSON.parse(req.body.post.attachments);
                parsedAttachments.forEach(function(attachment){
                    attachments.push({
                        indirizzo: attachment.name,
                        nome: attachment.originalName,
                        dimensione: attachment.size,
                        estensione: attachment.ext
                    });
                });
                updatedPost.allegati = attachments;
            }
            updatedPost.save(function(err, saved){
                if(err){
                    req.flash("error", "Errore nel salvataggio del file, mannaggia alla Peppina!");
                    console.log(err);
                    res.status(500).redirect("back");
                } else {
                    req.flash("success", "Post modificato con successo");
                    res.redirect("/posts/" + req.params.id);
                }
            })
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