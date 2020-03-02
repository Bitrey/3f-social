var Post = require("../models/post");
var Comment = require("../models/comment");

let middlewareObj = {};

middlewareObj.isPostOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Post.findById(req.params.id, function(err, foundPost){
            if(err){
                req.flash("error", "Post non trovato");
                res.status(404).redirect("back");
            } else {
                // foundPost.autore è un ref di Mongoose = all'ObjectId, quindi all'_id
                // Per comparare ObjectId con stringhe devi usare .equals()
                if(foundPost.autore.equals(req.user._id)){
                    next();
                } else {
                    console.log(`${foundPost.autore} diverso da ${req.user._id}`)
                    req.flash("error", "Non sei autorizzato");
                    res.status(401).redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Devi fare l'acesso per continuare");
        res.status(401).redirect("back");
    }
}

middlewareObj.isCommentOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                req.flash("error", err);
                res.status(500).redirect("back");
            } else {
                if(foundComment.author.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "Non sei autorizzato");
                    res.status(401).redirect("back");
                }
            }
        });
    } else {
        req.flash("info", "Devi fare l'acesso per continuare");
        res.status(401).redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("info", "Devi fare l'acesso per continuare");
    res.status(401).redirect("back");
}

module.exports = middlewareObj;