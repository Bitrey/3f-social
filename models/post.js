var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    tipoContenuto: { type: String, default: "post" },
    corso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    autore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    titolo: { type: String, default: "Nuovo post" },
    contenuto: { type: String, default: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
    contenutoJSON: String,
    pubblico: { type: Boolean, default: true },
    commentiAbilitati: { type: Boolean, default: true },
    commenti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likeRatio: { type: Number, default: 0 },
    like: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    dislike: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    dataCreazione: { type: Date, default: Date.now },
    immagine: {
        tipo: { type: String, default: "none" },
        indirizzo: { type: String, default: "/uploads/default.jpg" }
    },
    allegati: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Attachment"
        }
    ],
    categoria: { type: String, default: "default" }
});

postSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    let asyncThis = this;
    try {
        await asyncThis.populate("autore").execPopulate();
        await asyncThis.populate("commenti").execPopulate();
        await asyncThis.populate("allegati").execPopulate();
        await asyncThis.populate("corso").execPopulate();
        await asyncThis.corso.contenuti.pull({ _id: asyncThis._id });
        await asyncThis.autore.contenuti.pull({ _id: asyncThis._id });
        await asyncThis.corso.save();
        await asyncThis.autore.save();
        await asyncThis.model("Comment").deleteMany({ "_id": { $in: asyncThis.commenti } });
        // console.log(asyncThis.allegati);
        await asyncThis.model("Attachment").deleteMany({ "_id": { $in: asyncThis.allegati } });
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Post", postSchema);