var mongoose = require("mongoose");

var commentiSchema = new mongoose.Schema({
    username_autore: { type: String, default: "username" },
    id_autore: String,
    dataCreazione: { type: Date, default: Date.now },
    contenuto: { type: String, default: "Errore nel salvataggio del contenuto dio imbuto" },
    like: { type: Number, default: 0 },
    dislike: { type: Number, default: 0 }
})

module.exports = mongoose.model("Comment", commentiSchema);