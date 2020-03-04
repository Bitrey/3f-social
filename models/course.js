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
    pubblico: { type: Boolean, default: true },
    chatGlobale: { type: Boolean, default: true },
    chatPrivata: { type: Boolean, default: true },
    dataCreazione: { type: Date, default: Date.now },
    immagine: {
        tipo: { type: String, default: "local" },
        indirizzo: { type: String, default: "/uploads/default.jpg" }
    }
});

courseSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    try {
        await this.populate("partecipanti").execPopulate();
        await this.populate("contenuti").execPopulate();
        await this.partecipanti.forEach(async function(partecipante){
            await partecipante.corsi.pull({ _id: this._id });
            await partecipante.save();
        });
        await this.model("Post").deleteMany({ "_id": { $in: this.contenuti }, "tipoContenuto": { $eq: "post" } });
        await this.model("Poll").deleteMany({ "_id": { $in: this.contenuti }, "tipoContenuto": { $eq: "poll" } });
        next();
    } catch(err){
        next(err);
    }
});

module.exports = mongoose.model("Course", courseSchema);