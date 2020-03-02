var mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
    amministratori: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    partecipanti: [{
        id: String,
        username: String,
        immagine: { type: String, default: "/img/post/default.jpg" }
    }],
    titolo: { type: String, default: "Nuovo corso" },
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
    pubblico: { type: Boolean, default: true },
    chatAbilitata: { type: Boolean, default: true },
    dataCreazione: { type: Date, default: Date.now },
    immagine: {
        tipo: { type: String, default: "local" },
        indirizzo: { type: String, default: "/img/post/default.jpg" }
    }
});

module.exports = mongoose.model("Course", courseSchema);