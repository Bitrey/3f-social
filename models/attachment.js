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

attachmentSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    let asyncThis = this;
    try {
        await asyncThis.populate("proprietario").execPopulate();
        await asyncThis.populate("post").execPopulate();
        await asyncThis.proprietario.allegati.pull({ _id: asyncThis._id });
        await asyncThis.post.allegati.pull({ _id: asyncThis._id });
        await asyncThis.proprietario.save();
        await asyncThis.post.save();
        next();
    } catch(err){
        next(err);
    }
});

// ATTENZIONE: RISOLVI DELETEMANY

module.exports = mongoose.model("Attachment", attachmentSchema);