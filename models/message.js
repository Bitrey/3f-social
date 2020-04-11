var mongoose = require("mongoose");

var messaggiSchema = new mongoose.Schema({
    mittente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    destinatario: {
        adUtente: { type: Boolean, default: false },
        utente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        corso: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        },
    },
    contenuto: { type: String, default: "Errore nel salvataggio del messaggio" },
    dataCreazione: { type: Date, default: Date.now },
});

messaggiSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    let asyncThis = this;
    try {
        await asyncThis.populate("autore").execPopulate();
        await asyncThis.autore.messaggi.pull({ _id: asyncThis._id });
        await asyncThis.autore.save();
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Message", messaggiSchema);