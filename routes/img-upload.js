const router = require('express').Router();
const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, './public/img/post');
    },
    filename: function(req, file, callback){
        callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: {fileSize: 10000000} }).single('img-attachment');

router.post('/', function(req, res){
    upload(req, res, function(err){
        if(err){
            return res.json({msg: err.toString()});
        }
        if(req.file == undefined){
            return res.json({msg: "Nessun file selezionato"});
        }
        res.json({msg: "Immagine caricata!", name: String(req.file.filename), originalName: req.file.originalname, size: Number(req.file.size), ext: String(path.extname(req.file.originalname))});
    });
});

module.exports = router;