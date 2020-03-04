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
    try {
        await this.populate("proprietario").execPopulate();
        await this.populate("post").execPopulate();
        await this.proprietario.allegati.pull({ _id: this._id });
        await this.post.allegati.pull({ _id: this._id });
        await this.proprietario.save();
        await this.post.save();
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Attachment", attachmentSchema);