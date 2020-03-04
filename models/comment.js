var mongoose = require("mongoose");

var commentiSchema = new mongoose.Schema({
    autore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    dataCreazione: { type: Date, default: Date.now },
    contenuto: { type: String, default: "Errore nel salvataggio del contenuto dio imbuto" },
    like: { type: Number, default: 0 },
    dislike: { type: Number, default: 0 }
});

commentiSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    try {
        await this.populate("autore").execPopulate();
        await this.autore.commenti.pull({ _id: this._id });
        await this.autore.save();
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Comment", commentiSchema);