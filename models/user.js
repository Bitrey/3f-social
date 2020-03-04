var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    googleId: String,
    // Dati presi da oAuth NON MODIFICABILI
    datiGoogle: {
        nome: { type: String, default: "nome" },
        cognome: { type: String, default: "cognome" },
        email: { type: String, default: "email" },
        username: { type: String, default: "username" },
        immagine: { type: String, default: "/uploads/default.jpeg" }
    },
    // Dati MODIFICABILI
    nome: { type: String, default: "nome" },
    cognome: { type: String, default: "cognome" },
    email: { type: String, default: "email" },
    username: { type: String, default: "username" },
    immagine: {
        tipo: { type: String, default: "none" },
        indirizzo: { type: String, default: "/uploads/default.jpg" }
    },
    residenza: {
        regione: { type: String, default: "" },
        provincia: { type: String, default: "" },
        comune: { type: String, default: "" }
    },
    biografia: { type: String, default: "" },
    dataCreazione: { type: Date, default: Date.now },
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
    messaggi: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }
    ],
    corsi: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],
    allegati: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Attachment"
        }
    ],
    commenti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    try {
        await this.populate("contenuti").execPopulate();
        await this.populate("messaggi").execPopulate();
        await this.populate("corsi").execPopulate();
        await this.populate("allegati").execPopulate();
        await this.populate("commenti").execPopulate();
        await this.model("Post").deleteMany({ "_id": { $in: this.contenuti }, "tipoContenuto": { $eq: "post" } });
        await this.model("Poll").deleteMany({ "_id": { $in: this.contenuti }, "tipoContenuto": { $eq: "poll" } });
        await this.model("Message").deleteMany({ "_id": { $in: this.messaggi } });
        await this.model("Attachment").deleteMany({ "_id": { $in: this.allegati } });
        await this.model("Comment").deleteMany({ "_id": { $in: this.commenti } });

        await this.corsi.forEach(async function(corso){
                await corso.partecipanti.pull({ _id: this._id });
                await corso.amministratori.findById(this._id, async function(err, foundAdmin){
                    if(foundAdmin){
                        await corso.amministratori.pull({ _id: this._id });
                    }
                await corso.save();
            });
        });
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("User", userSchema);