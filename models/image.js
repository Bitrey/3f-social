let mongoose = require("mongoose");

let imageSchema = new mongoose.Schema({
    // tipo: "local" / "url" / "none"
    tipo: { type: String, default: "none" },
    indirizzo: { type: String, default: "/uploads/default.jpg" },
    documento: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Instead of a hardcoded model name in `ref`, `refPath` means Mongoose
      // will look at the `onModel` property to find the right model.
      refPath: 'modello'
    },
    modello: {
      type: String,
      required: true,
      enum: ['User', 'Post', 'Course', 'Poll']
    }
});

module.exports = mongoose.model("Image", imageSchema);