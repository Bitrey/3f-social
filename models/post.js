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
    try {
        await this.populate("autore").execPopulate();
        await this.populate("commenti").execPopulate();
        await this.populate("allegati").execPopulate();
        await this.populate("corso").execPopulate();
        await this.corso.contenuti.pull({ _id: this._id });
        await this.autore.contenuti.pull({ _id: this._id });
        await this.corso.save();
        await this.autore.save();
        await this.model("Comment").deleteMany({ "_id": { $in: this.commenti } });
        await this.model("Attachment").deleteMany({ "_id": { $in: this.allegati } });
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Post", postSchema);