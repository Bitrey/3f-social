var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    titolo: String,
    contenuto: String,
    soloFermi: Boolean,
    commenti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    like: Number,
    dislike: Number,
    immagine: String
})

module.exports = mongoose.model("Post", postSchema);