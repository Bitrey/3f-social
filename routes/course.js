const router = require('express').Router();
const Post = require("../models/post");

router.get("/", function(req, res){
    res.render("courses/list");
})

router.get("/view", function(req, res){
    Post.find({}).
    populate("autore").
    exec(function(err, posts){
        if(err){
            req.flash("error", "Si è verificato un errore nel caricamento, mannaggia alla Peppina");
            console.log(err);
            res.status(500).redirect("back");
        } else {
            res.render("courses/view", { posts: posts.reverse() });
        }
    });
})

router.get("/new", function(req, res){
    res.render("courses/new");
})

module.exports = router;