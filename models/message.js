var mongoose = require("mongoose");

var messaggiSchema = new mongoose.Schema({
    corso: String,
    autore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    contenuto: { type: String, default: "Errore nel salvataggio del messaggio dio ortaggio" },
    dataCreazione: { type: Date, default: Date.now },
});

messaggiSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    try {
        await this.populate("autore").execPopulate();
        await this.autore.messaggi.pull({ _id: this._id });
        await this.autore.save();
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Message", messaggiSchema);