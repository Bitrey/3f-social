var mongoose = require("mongoose");

var messaggiSchema = new mongoose.Schema({
    autore: {
        id: String,
        username: String,
        immagine: { type: String, default: "/img/post/default.jpg" }
    },
    contenuto: { type: String, default: "Errore nel salvataggio del messaggio dio ortaggio" },
    dataCreazione: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Message", messaggiSchema);