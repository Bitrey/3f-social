var mongoose = require("mongoose");

var messaggiSchema = new mongoose.Schema({
    usernameAutore: { type: String, default: "Errore nel salvataggio username" },
    idAutore: String,
    contenuto: { type: String, default: "Errore nel salvataggio del messaggio dio ortaggio" },
    dataCreazione: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Message", messaggiSchema);