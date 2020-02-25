var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    autore: {
        id: String,
        username: String
    },
    titolo: { type: String, default: "Nuovo post" },
    contenuto: { type: String, default: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
    soloFermi: { type: Boolean, default: false },
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
        tipo: { type: String, default: "local" },
        indirizzo: { type: String, default: "/img/post/default.jpeg" }
    },
    allegati: [{
        indirizzo: String,
        nome: String,
        dimensione: Number,
        estensione: String
    }]
})

module.exports = mongoose.model("Post", postSchema);