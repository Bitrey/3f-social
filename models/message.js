var mongoose = require("mongoose");

var messaggiSchema = new mongoose.Schema({
    username_autore: String,
    id_autore: String,
    contenuto: String
})

module.exports = mongoose.model("Message", messaggiSchema);