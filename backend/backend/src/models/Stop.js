const stopSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lon: Number,

  lineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Line",
    required: true
  },

  direction: {
    type: String,
    enum: ["ida", "vuelta"],
    required: true
  },

  isTerminal: {
    type: Boolean,
    default: false
  }
});