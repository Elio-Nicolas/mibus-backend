const lineSchema = new mongoose.Schema({
  name: String,

  route: [
    {
      lat: Number,
      lon: Number
    }
  ],

  terminalA: {
    lat: Number,
    lon: Number
  },

  terminalB: {
    lat: Number,
    lon: Number
  }
});