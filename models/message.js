var mongoose = require("mongoose");

var messaggiSchema = new mongoose.Schema({
    username_autore: { type: String, default: "Errore nel salvataggio username" },
    id_autore: String,
    contenuto: { type: String, default: "Errore nel salvataggio del messaggio dio ortaggio" },
    dataCreazione: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Message", messaggiSchema);