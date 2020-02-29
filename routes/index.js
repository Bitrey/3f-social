const router = require('express').Router();
const Post = require("../models/post");

router.get("/", function(req, res){
    res.redirect("/courses")
})

router.get("/info", function(req, res){
    res.render("info");
})

module.exports = router;