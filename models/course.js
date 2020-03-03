var mongoose = require("mongoose");
var randomstring = require("randomstring");

var courseSchema = new mongoose.Schema({
    amministratori: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    partecipanti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    titolo: { type: String, default: "Nuovo corso" },
    descrizione: { type: String, default: "Nessuna descrizione impostata per questo corso" },
    contenuti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Poll"
        }
    ],
    codice: { type: String, default: randomstring.generate({
        length: 9,
        readable: true,
        capitalization: "uppercase"
    })},
    pubblico: { type: Boolean, default: true },
    chatGlobale: { type: Boolean, default: true },
    chatPrivata: { type: Boolean, default: true },
    dataCreazione: { type: Date, default: Date.now },
    immagine: {
        tipo: { type: String, default: "local" },
        indirizzo: { type: String, default: "/uploads/default.jpg" }
    }
});

module.exports = mongoose.model("Course", courseSchema);