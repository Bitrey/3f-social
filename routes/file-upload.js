const router = require('express').Router();
const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, path.join(__dirname + "uploads"));
    },
    filename: function(req, file, callback){
        callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: {fileSize: 10000000} }).single('attachment');

router.post('/', function(req, res){
    try {
        upload(req, res, function(err){
            if(err){
                return res.status(500).json({msg: err.toString()});
            }
            if(!req.file){
                return res.status(400).json({msg: "Nessun file selezionato"});
            }
            res.json({msg: "File caricato!", name: String(req.file.filename), originalName: req.file.originalname, size: Number(req.file.size), ext: String(path.extname(req.file.originalname))});
            return false;
        });
    } catch(err){
        console.error(err);
        return res.status(500).json({msg: err.toString()});
    }
});

module.exports = router;