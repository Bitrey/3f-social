var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    autore: {
        id: String,
        username: String,
        immagine: { type: String, default: "/img/post/default.jpg" }
    },
    titolo: { type: String, default: "Nuovo post" },
    contenuto: { type: String, default: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
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
        indirizzo: { type: String, default: "/img/post/default.jpg" }
    },
    allegati: [{
        indirizzo: String,
        nome: String,
        dimensione: Number,
        estensione: String
    }],
    categoria: { type: String, default: "default" }
});

module.exports = mongoose.model("Post", postSchema);