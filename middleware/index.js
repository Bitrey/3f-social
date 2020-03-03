var Post = require("../models/post");
var Comment = require("../models/comment");
const Course = require("../models/course");
const User = require("../models/user");

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
        res.redirect("/auth/google");
        // req.flash("info", "Devi fare l'acesso per continuare");
        // res.status(401).redirect("back");
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
        res.redirect("/auth/google");
        // req.flash("info", "Devi fare l'acesso per continuare");
        // res.status(401).redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/auth/google");
    // req.flash("info", "Devi fare l'acesso per continuare");
    // res.status(401).redirect("back");
}

middlewareObj.userInCourse = function(req, res, next){
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
            if(isInCourse(foundCourse, foundUser)){
                req.course = foundCourse;
                req.user = foundUser;
                next();
            } else {
                req.flash("error", "Non sei iscritto al corso");
                res.status(401).redirect("back");
            }
        })
    })
}

function isInCourse(course, user){
    for(let i = 0; i < course.partecipanti.length; i++){
        if(course.partecipanti[i]._id.equals(user._id)){
            return true;
        }
    }
    return false;
}

module.exports = middlewareObj;