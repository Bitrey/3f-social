var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    googleId: String,
    // Dati presi da oAuth NON MODIFICABILI
    datiGoogle: {
        nome: { type: String, default: "nome" },
        cognome: { type: String, default: "cognome" },
        email: { type: String, default: "email" },
        username: { type: String, default: "username" },
        immagine: { type: String, default: "/img/post/default.jpeg" }
    },
    // Dati MODIFICABILI
    nome: { type: String, default: "nome" },
    cognome: { type: String, default: "cognome" },
    email: { type: String, default: "email" },
    username: { type: String, default: "username" },
    immagine: {
        tipo: { type: String, default: "none" },
        indirizzo: { type: String, default: "/img/post/default.jpg" }
    },
    residenza: {
        regione: { type: String, default: "" },
        provincia: { type: String, default: "" },
        comune: { type: String, default: "" }
    },
    biografia: { type: String, default: "" },
    dataCreazione: { type: Date, default: Date.now },
    post: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    messaggi: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }
    ],
    corsi: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        },]
});

module.exports = mongoose.model("User", userSchema);

