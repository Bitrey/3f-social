var mongoose = require("mongoose");

var pollSchema = new mongoose.Schema({
    tipoContenuto: { type: String, default: "poll" },
    corso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    autore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    titolo: { type: String, default: "Nuovo sondaggio" },
    scelte: [{
        titolo: { type: String, default: "Opzione" },
        colore: { type: String, default: "#2ab7ca" },
        voti: [{
            votante: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            dataVotazione: { type: Date, default: Date.now }
        }]
    }],
    pubblico: { type: Boolean, default: true },
    commenti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    like: { type: Number, default: 0 },
    dataCreazione: { type: Date, default: Date.now },
    dislike: { type: Number, default: 0 },
    immagine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image"
    },
    votiVisibiliDopoVotazione: { type: Boolean, default: false },
    votoCambiabile: { type: Boolean, default: false },
    chiediConfermaVoto: { type: Boolean, default: true },
    dataChiusura: { type: Date, default: Date.now },
    categoria: { type: String, default: "default" }
});

pollSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    let asyncThis = this;
    try {
        await asyncThis.populate("autore").execPopulate();
        await asyncThis.populate("commenti").execPopulate();
        await asyncThis.populate("corso").execPopulate();
        await asyncThis.corso.contenuti.pull({ _id: asyncThis._id });
        await asyncThis.autore.contenuti.pull({ _id: asyncThis._id });
        await asyncThis.corso.save();
        await asyncThis.autore.save();
        await asyncThis.model("Comment").deleteMany({ "_id": { $in: asyncThis.commenti } });
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Poll", pollSchema);