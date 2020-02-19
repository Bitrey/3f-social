var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    nome: String,
    cognome: String,
    email: String,
    username: String,
    immagine: String,
    dataCreazione: Date,
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

