var mongoose = require("mongoose");
var randomstring = require("randomstring");

var courseSchema = new mongoose.Schema({
    amministratori: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    partecipanti: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    titolo: { type: String, default: "Nuovo corso" },
    descrizione: { type: String, default: "Nessuna descrizione impostata per questo corso" },
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
    codice: { type: String, default: randomstring.generate({
        length: 9,
        readable: true,
        capitalization: "uppercase"
    })},
    stanzaSocket: {
        type: String,
        default: randomstring.generate()
    },
    pubblico: { type: Boolean, default: true },
    chatGlobale: { type: Boolean, default: true },
    chatPrivata: { type: Boolean, default: true },
    dataCreazione: { type: Date, default: Date.now },
    immagine: {
        tipo: { type: String, default: "local" },
        indirizzo: { type: String, default: "/uploads/default.jpg" }
    },
    messaggi: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }
    ]
});

courseSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    let asyncThis = this;
    try {
        await asyncThis.populate("partecipanti").execPopulate();
        await asyncThis.populate("contenuti").execPopulate();
        await asyncThis.partecipanti.forEach(async function(partecipante){
            await partecipante.corsi.pull({ _id: asyncThis._id });
            await partecipante.save();
        });
        await asyncThis.model("Post").deleteMany({ "_id": { $in: asyncThis.contenuti }, "tipoContenuto": { $eq: "post" } });
        await asyncThis.model("Poll").deleteMany({ "_id": { $in: asyncThis.contenuti }, "tipoContenuto": { $eq: "poll" } });
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Course", courseSchema);