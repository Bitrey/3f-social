const router = require('express').Router();
const Course = require("../models/course");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const middleware = require("../middleware");

const marked = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

router.post("/:post", middleware.isLoggedIn, function(req, res){
    Post.findById(req.params.post).
    exec(function(err, foundPost){
        if(err){
            console.log(err);
            res.sendStatus(500);
            return false;
        } else if(!foundPost){
            res.sendStatus(404);
            return false;
        } else if(!foundPost.commentiAbilitati){
            res.sendStatus(401);
            return false;
        }
        Course.findById(foundPost.corso).
        exec(function(err, foundCourse){
            if(err){
                console.log(err);
                res.sendStatus(500);
                return false;
            } else if(!foundCourse){
                res.sendStatus(404);
                return false;
            }
            let partecipanteFlag = false;
            foundCourse.partecipanti.forEach(function(partecipante){
                if(partecipante.equals(req.user._id)){
                    partecipanteFlag = true;
                    return false;
                }
            });
            if(!partecipanteFlag){
                res.sendStatus(401);
                return false;
            }
            let comment = new Comment({
                autore: req.user._id,
                contenuto: DOMPurify.sanitize(marked(req.body.contenuto, {breaks: true}), {ALLOWED_TAGS: [ 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
                'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
                'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe' ]})
            });
            comment.save(function(err){
                if(err){
                    console.log(err);
                    res.sendStatus(500);
                    return false;
                }
                foundPost.commenti.push(comment._id);
                foundPost.save(function(err){if(err){console.log(err);}});
                User.findById(req.user._id).
                exec(function(err, foundUser){
                    if(err){console.log(err); return false;}
                    foundUser.commenti.push(comment._id);
                    foundUser.save(function(err){if(err){console.log(err);}});
                });
                res.sendStatus(201);
            });
        });
    });
});

function commentVote(thing, req, res){
    Comment.findById(req.params.id).
    exec(function(err, foundComment){
        if(err){
            console.log(err);
            res.sendStatus(500);
            return false;
        } else if(!foundComment){
            res.sendStatus(404);
            return false;
        }
        let hasVoted = false;
        foundComment[thing].forEach(function(vote){
            if(vote.equals(req.user._id)){
                hasVoted = true;
                return false;
            }
        });
        if(hasVoted){
            foundComment[thing].pull(req.user._id);
        } else {
            foundComment[thing].push(req.user._id);
        }
        let antithing = thing == "like" ? "dislike" : "like";
        let oppositeVote = false;
        foundComment[antithing].forEach(function(vote){
            if(vote.equals(req.user._id)){
                oppositeVote = true;
                return false;
            }
        });
        if(oppositeVote){
            foundComment[antithing].pull(req.user._id);
        }
        foundComment.save(function(err){
            if(err){
                console.log(err);
                res.sendStatus(500);
                return false;
            }
            let resJSON = {};
            resJSON[thing] = foundComment[thing].length.toString();
            resJSON[antithing] = foundComment[antithing].length.toString();
            res.json(resJSON);
        })
    });
}

router.post("/:id/like", middleware.isLoggedIn, function(req, res){
    commentVote("like", req, res);
});

router.post("/:id/dislike", middleware.isLoggedIn, function(req, res){
    commentVote("dislike", req, res);
});

module.exports = router;