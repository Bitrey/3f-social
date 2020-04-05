const express = require("express");
const router = express.Router();
const Course = require("../models/course");
const Post = require("../models/post");
const User = require("../models/user");
const Attachment = require("../models/attachment");
const middleware = require("../middleware");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

router.get("/:course/new", middleware.isLoggedIn, function(req, res){
    Course.findById(req.params.course, function(err, foundCourse){
        if(err){
            console.log(err);
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
            console.log(err);
            req.flash("error", "Errore nella ricerca del corso");
            res.status(500).redirect("back");
            return false;
        }
        User.findById(req.user.id, async function(err, foundUser){
            if(err){
                req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
                console.log(err);
                res.status(500).redirect("back");
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
                    // contenuto: sanitizeHtml(req.body.quill, {
                    //     allowedTags: sanitizeHtml.defaults.allowedTags.concat(['span', 'mrow', 'svg'])
                    // }),
                    contenuto: DOMPurify.sanitize(req.body.quill),
                    contenutoJSON: req.body.quillJSON,
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
                        // L'utente viene comunque salvato dopo
                        // await foundUser.save(function(err){if(err){console.log(err);}});
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
                        foundUser.contenuti.push(newPost._id);
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

function showPost(req, res, post){
    if(post){
        res.render("posts/view", { post: post, corso: post.corso });
    } else {
        req.flash("error", "Post non trovato");
        res.status(404).redirect("back");
    }
}

function dontShowPost(req, res){
    req.flash("error", "Non sei autorizzato a vedere questo post");
    res.status(401).redirect("back");
}

// SHOW POST
router.get("/:post", async function(req, res){
    Post.findById(req.params.post).
    populate("corso").
    populate({path: "commenti", options: { sort: { 'dataCreazione': -1 } }}).
    populate("autore").
    populate("allegati").
    exec(async function(err, post){
        for(let i = 0; i < post.commenti.length; i++){
            await post.commenti[i].populate("autore").execPopulate();
        }
        if(err){
            req.flash("error", err.message);
            res.status(500).redirect("/");
        } else {
            if(post.corso.pubblico){
                showPost(req, res, post);
            } else {
                if(req.isAuthenticated()){
                    let isInCourse = false;
                    post.corso.partecipanti.forEach(function(partecipante){
                        if(partecipante.equals(req.user.id)){
                            isInCourse = true;
                            return false;
                        };
                    });
                    if(isInCourse){
                        showPost(req, res, post);
                    } else {
                        dontShowPost(req, res);
                    }
                } else {
                    dontShowPost(req, res);
                }
            }
        }
    });
});

// EDIT POST
router.get("/:id/edit", middleware.isPostOwner, function(req, res){
    Post.findById(req.params.id).
    populate("corso").
    populate("allegati").
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
    Post.findByIdAndUpdate(req.params.id, req.body.post, async function(err, updatedPost){
        if(err){
            req.flash("error", err.msg);
            console.log(err);
            res.status(500).redirect("back");
        } else {
            User.findById(req.user.id, async function(err, foundUser){
                if(err){
                    req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
                    console.log(err);
                    res.status(500).redirect("back");
                } else {
                    updatedPost.immagine = JSON.parse(req.body.post.img);
                    if(req.body.post.attachments){
                        let parsedAttachments = JSON.parse(req.body.post.attachments);
                        await parsedAttachments.forEach(async function(attachment){
                            let flag = false;
                            await updatedPost.allegati.forEach(async function(postAttachment){
                                if(postAttachment == attachment._id){
                                    flag = true;
                                }
                            });
                            if(!flag){
                                attachment = new Attachment({
                                    proprietario: foundUser._id,
                                    post: updatedPost._id,
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
                                await updatedPost.allegati.push(attachment._id);
                            }
                            flag = false;
                        });
                    }
                    updatedPost.contenutoJSON = req.body.quillJSON;
                    // updatedPost.contenuto = sanitizeHtml(req.body.post.quill, {
                        // allowedTags: sanitizeHtml.defaults.allowedTags.concat(['span', 'mrow', 'svg'])
                    // });
                    updatedPost.contenuto = DOMPurify.sanitize(req.body.post.quill);
                    // updatedPost.contenuto = req.body.post.quill;
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
        }
    });
});

router.delete("/:course/:id", middleware.isPostOwner, async function(req, res){
    Post.findById(req.params.id).
    exec(async function(err, foundPost){
        if(err){
            console.log(err);
            req.flash("error", "Errore nella ricerca del post");
            res.status(500).redirect("back");
        } else {
            if(foundPost){
                foundPost.deleteOne(function(err){
                    if(err){
                        console.log(err);
                        req.flash("error", "Errore nell'eliminazione del post");
                        res.status(500).redirect("back");
                        return false;
                    } else {
                        req.flash("success", "Post eliminato con successo");
                        res.redirect("/courses/" + req.params.course);
                    }
                });
            } else {
                req.flash("error", "Nessun post trovato");
                res.status(404).redirect("back");
            }
        }
    });
});

module.exports = router;