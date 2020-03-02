var mongoose = require("mongoose");

var attachmentSchema = new mongoose.Schema({
    proprietario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    indirizzo: String,
    nome: String,
    dimensione: Number,
    estensione: String,
    dataCreazione: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attachment", attachmentSchema);