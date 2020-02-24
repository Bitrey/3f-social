const router = require('express').Router();
const mongoose = require("mongoose");
const Post = require("../models/post");
const User = require("../models/user");

router.get("/:id", function(req, res){
    Post.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
            // req.flash("error", err);
            res.redirect("/");
        } else {
            if(post){
                User.findById(post.idAutore, function(err, user){
                    if(err){
                        console.log(err);
                        // req.flash("error", err);
                        res.redirect("/");
                    } else {
                        if(user){
                            res.render("posts/view", { post: post, utente: req.user, autore: user.username });
                        } else {
                            res.status(404).send("Utente non trovato");
                        }
                    }
                })
            } else {
                res.status(404).send("Post non trovato");
            }
        }
    })
});

module.exports = router;