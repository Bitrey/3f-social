var mongoose = require("mongoose");

var commentiSchema = new mongoose.Schema({
    username_autore: String,
    id_autore: String,
    contenuto: String,
    like: Number,
    dislike: Number
})

module.exports = mongoose.model("Comment", commentiSchema);