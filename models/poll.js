var mongoose = require("mongoose");

var pollSchema = new mongoose.Schema({
    tipoContenuto: { type: String, default: "poll" },
    corso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    autore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    titolo: { type: String, default: "Nuovo sondaggio" },
    scelte: [{
        titolo: { type: String, default: "Opzione" },
        colore: { type: String, default: "#2ab7ca" },
        voti: [{
            votante: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            dataVotazione: { type: Date, default: Date.now }
        }]
    }],
    pubblico: { type: Boolean, default: true },
    commenti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    like: { type: Number, default: 0 },
    dataCreazione: { type: Date, default: Date.now },
    dislike: { type: Number, default: 0 },
    immagine: {
        tipo: { type: String, default: "none" },
        indirizzo: { type: String, default: "/uploads/default.jpeg" }
    },
    votiVisibiliDopoVotazione: { type: Boolean, default: false },
    votoCambiabile: { type: Boolean, default: false },
    chiediConfermaVoto: { type: Boolean, default: true },
    dataChiusura: { type: Date, default: Date.now },
    categoria: { type: String, default: "default" }
});

module.exports = mongoose.model("Poll", pollSchema);