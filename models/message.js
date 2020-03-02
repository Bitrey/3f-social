var mongoose = require("mongoose");

var messaggiSchema = new mongoose.Schema({
    corso: String,
    autore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    contenuto: { type: String, default: "Errore nel salvataggio del messaggio dio ortaggio" },
    dataCreazione: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Message", messaggiSchema);