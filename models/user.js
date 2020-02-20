var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    nome: { type: String, default: "nome" },
    cognome: { type: String, default: "cognome" },
    email: { type: String, default: "email" },
    username: { type: String, default: "username" },
    immagine: { type: String, default: "/img/post/default.jpeg" },
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
});

module.exports = mongoose.model("User", userSchema);

