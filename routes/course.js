const router = require('express').Router();
const Post = require("../models/post");

router.get("/", function(req, res){
    Post.find({}, function(err, posts){
        if(err){
            log.error(err);
            res.status(400).send("Si è verificato un errore nel caricamento, mannaggia alla Peppina");
        } else {
            res.render("courses/list", { posts: posts.reverse() });
        }
    });
})

module.exports = router;