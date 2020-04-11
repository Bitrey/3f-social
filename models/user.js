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
    ],
    like: {
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post"
            }
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
    },
    dislike: {
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post"
            }
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
    }
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    let asyncThis = this;
    try {
        await asyncThis.populate("contenuti").execPopulate();
        await asyncThis.populate("messaggi").execPopulate();
        await asyncThis.populate("corsi").execPopulate();
        await asyncThis.populate("allegati").execPopulate();
        await asyncThis.populate("commenti").execPopulate();
        await asyncThis.model("Post").deleteMany({ "_id": { $in: asyncThis.contenuti }, "tipoContenuto": { $eq: "post" } });
        await asyncThis.model("Poll").deleteMany({ "_id": { $in: asyncThis.contenuti }, "tipoContenuto": { $eq: "poll" } });
        await asyncThis.model("Message").deleteMany({ "_id": { $in: asyncThis.messaggi } });
        await asyncThis.model("Attachment").deleteMany({ "_id": { $in: asyncThis.allegati } });
        await asyncThis.model("Comment").deleteMany({ "_id": { $in: asyncThis.commenti } });

        await asyncThis.corsi.forEach(async function(corso){
                await corso.partecipanti.pull({ _id: asyncThis._id });
                await corso.amministratori.findById(asyncThis._id, async function(err, foundAdmin){
                    if(foundAdmin){
                        await corso.amministratori.pull({ _id: asyncThis._id });
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