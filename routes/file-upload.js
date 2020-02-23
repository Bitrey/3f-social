const router = require('express').Router();
var path = require("path");
var multer = require("multer");

var storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, './uploads');
    },
    filename: function(req, file, callback){
        callback(null, Date.now() + "-" + file.originalname);
    }
});

var upload = multer({ storage: storage }).single('filetoupload');

router.post('/', function(req, res){
    upload(req, res, function(err){
        if (err){
            return res.end("Errore nel caricamento del file");
        }
        res.end("File caricato!");
    });
});

module.exports = router;