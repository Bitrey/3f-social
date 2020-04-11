const User = require("../models/user");
var Post = require("../models/post");
var Poll = require("../models/poll");
var Course = require("../models/course");
var Comment = require("../models/comment");
var Attachment = require("../models/attachment");
var Message = require("../models/message");

let middlewareObj = {};

middlewareObj.isPostOwner = function(req, res, next){
    if(!req.params.id && req.params.post) req.params.id = req.params.post;
    if(req.isAuthenticated()){
        Post.findById(req.params.id, function(err, foundPost){
            if(err){
                req.flash("error", "Post non trovato");
                res.status(404).redirect("back");
            } else {
                if(foundPost){
                    // foundPost.autore è un ref di Mongoose = all'ObjectId, quindi all'_id
                    // Per comparare ObjectId con stringhe devi usare .equals()
                    if(foundPost.autore.equals(req.user._id)){
                        next();
                    } else {
                        console.log(`${foundPost.autore} diverso da ${req.user._id}`)
                        req.flash("error", "Non sei autorizzato");
                        res.status(401).redirect("back");
                    }
                } else {
                    req.flash("error", "Il post non esiste o è stato eliminato");
                    res.status(400).redirect("back");
                }
            }
        });
    } else {
        res.redirect("/auth/google");
        // req.flash("info", "Devi fare l'acesso per continuare");
        // res.status(401).redirect("back");
    }
}

middlewareObj.isCourseAdmin = function(req, res, next){
    if(req.isAuthenticated()){
        Course.findById(req.params.course, function(err, foundCourse){
            if(err){
                req.flash("error", "Corso non trovato");
                res.status(404).redirect("back");
            } else {
                if(foundCourse){
                    // foundCourse.autore è un ref di Mongoose = all'ObjectId, quindi all'_id
                    // Per comparare ObjectId con stringhe devi usare .equals()
                    let foundCourseFlag = false;
                    foundCourse.amministratori.forEach(function(admin){
                        // Admin non è popolato, quindi sono ObjectId di utenti admin
                        if(admin.equals(req.user._id)){
                            foundCourseFlag = true;
                            return false;
                        }
                    });
                    if(foundCourseFlag){
                        next();
                    } else {
                        console.log(`Il tuo ID (${req.user._id}) non corrisponde a quello di un amministratore`);
                        req.flash("error", "Non sei autorizzato");
                        res.status(401).redirect("back");
                    }
                } else {
                    req.flash("error", "Il corso non esiste o è stato eliminato");
                    res.status(400).redirect("back");
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
                if(foundComment){
                    if(foundComment.author.equals(req.user._id)){
                        next();
                    } else {
                        req.flash("error", "Non sei autorizzato");
                        res.status(401).redirect("back");
                    }
                } else {
                    req.flash("error", "Il commento non esiste o è stato eliminato");
                    res.status(400).redirect("back");
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
                console.error(err);
                req.flash("error", "Errore nel caricamento del corso");
                res.status(500).redirect("back");
            }
            return false;
        }
        if(foundCourse){
            User.findById(req.user.id).
            exec(function(err, foundUser){
                if(err){
                    console.error(err);
                    req.flash("error", "Errore nella ricerca dell'utente. Hai un profilo buggato?");
                    res.status(500).redirect("back");
                    return false;
                }
                if(foundUser){
                    if(isInCourse(foundCourse, foundUser)){
                        req.course = foundCourse;
                        req.user = foundUser;
                        next();
                    } else {
                        req.flash("error", "Non sei iscritto al corso");
                        res.status(401).redirect("back");
                    }
                } else {
                    req.flash("error", "L'utente non esiste o è stato eliminato");
                    res.status(400).redirect("back");
                }
            });
        } else {
            req.flash("error", "Il corso non esiste o è stato eliminato");
            res.status(400).redirect("back");
        }
    });
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