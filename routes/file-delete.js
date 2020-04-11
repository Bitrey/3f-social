const router = require("express").Router();
const Course = require("../models/course");
const Post = require("../models/post");
const User = require("../models/user");
const Attachment = require("../models/attachment");
const middleware = require("../middleware");

router.delete("/", middleware.isLoggedIn, function(req, res){
    let id = req.body.attachmentId;
    if(!id){
        return res.status(400).json({msg: "ID non valido"});
    }
    Attachment.findById(id).
    populate("proprietario").
    // populate("post").
    // populate("post.corso").
    // populate("post.corso.contenuti").
    populate({
        path: 'post',			
        populate: { path: 'corso', model: 'Course' }
    }).
    exec(function(err, foundAttachment){
        if(err){
            return res.status(500).json({msg: err});
        } else if(!foundAttachment){
            return res.sendStatus(404);
        }
        // foundAttachment.proprietario.allegati.pull()
        let userInCourse = false;
        foundAttachment.post.corso.partecipanti.forEach(function(partecipante){
            if(partecipante.equals(req.user._id)){
                userInCourse = true;
                return false;
            };
        });
        if(!userInCourse){
            return res.status(401).json({msg: "Non sei iscritto al corso"});
        }
        foundAttachment.post.allegati.pull(foundAttachment._id);
        foundAttachment.proprietario.allegati.pull(foundAttachment._id);
        foundAttachment.post.save(function(err){
            if(err){
                console.error(err);
                return res.status(500).json({msg: err});
            }
            foundAttachment.proprietario.save(function(err){
                if(err){
                    console.error(err);
                    return res.status(500).json({msg: err});
                }
                foundAttachment.deleteOne(function(err){
                    if(err){
                        console.error(err);
                        return res.status(500).json({msg: err});
                    }
                    return res.json({msg: "ok"});
                });
            });
        });
    });
    // console.log(req.body);
});

module.exports = router;