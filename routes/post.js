const express = require("express");
const router = express.Router();
const Course = require("../models/course");
const Post = require("../models/post");
const User = require("../models/user");
const Attachment = require("../models/attachment");
const middleware = require("../middleware");

router.get("/:course/new", middleware.isLoggedIn, function(req, res){
    Course.findById(req.params.course, function(err, foundCourse){
        if(err){
            req.flash("error", "Errore nella ricerca del corso");
            res.status(500).redirect("back");
            return false;
        }
        res.render("posts/new", { corso: foundCourse });
    });
});

router.post("/:course", middleware.isLoggedIn, async function(req, res){
    Course.findById(req.params.course, function(err, foundCourse){
        if(err){
            req.flash("error", "Errore nella ricerca del corso");
            res.status(500).redirect("back");
            return false;
        }
        User.findById(req.user.id, async function(err, foundUser){
            if(err){
                req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
                console.log(err);
                res.redirect("back");
            } else {
                let userInCourseFlag = false;
                foundCourse.partecipanti.forEach(function(partecipante){
                    if(partecipante.equals(foundUser._id)){
                        userInCourseFlag = true;
                    }
                });
                if(!userInCourseFlag){
                    req.flash("error", `Non fai parte del corso ${foundCourse.titolo}. Se pensi che sia un errore, scrivimi una mail.`);
                    res.status(401).redirect("back");
                    return false;
                }
                // Crea nuovo post
                let newPost = new Post({
                    corso: foundCourse._id,
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
                        // Salva post in utente e corso
                        foundUser.post.push(newPost._id);
                        foundUser.save(function(err){if(err){console.log(err);}});
                        foundCourse.contenuti.push(newPost._id);
                        foundCourse.save(function(err){if(err){console.log(err);}});
                        req.flash("success", "Nuovo post aggiunto!");
                        res.redirect("/posts/" + savedPost._id);
                    }
                });
            }
        });
    });
});

// SHOW POST
router.get("/:id", function(req, res){
    Post.findById(req.params.id).
    populate("corso").
    populate("commenti").
    populate("autore").
    populate("allegati").
    exec(function(err, post){
        if(err){
            req.flash("error", err.message);
            res.status(500).redirect("/");
        } else {
            if(post){
                res.render("posts/view", { post: post, contenutoJSON: JSON.stringify(post.contenuto), corso: post.corso });
            } else {
                req.flash("error", "Post non trovato");
                res.status(404).redirect("back");
            }
        }
    });
});

// EDIT POST
router.get("/:id/edit", function(req, res){
    Post.findById(req.params.id).
    populate("corso").
    exec(function(err, foundPost){
        if(err){
            req.flash("error", err.message);
            console.log(err);
            res.status(500).redirect("back");
        } else {
            res.render("posts/edit", { post: foundPost, postJSON: JSON.stringify(foundPost), corso: foundPost.corso });
        }
    });
});

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
            });
        }
    });
});

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
    });
});

module.exports = router;