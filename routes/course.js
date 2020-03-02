const router = require('express').Router();
const Post = require("../models/post");

router.get("/", function(req, res){
    res.redirect("/courses/view");
})

router.get("/view", function(req, res){
    Post.find({}).
    populate("autore").
    exec(function(err, posts){
        if(err){
            req.flash("error", "Si è verificato un errore nel caricamento, mannaggia alla Peppina");
            console.log(err);
            res.status(400).redirect("back");
        } else {
            res.render("courses/list", { posts: posts.reverse() });
        }
    });
})

module.exports = router;