const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for model
const modelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(value) {
          // Check if the value contains any spaces
          return !/\s/.test(value);
      },
      message: 'Spaces are not allowed in field: name'
  }
  },
  imageThumbnail: { type: Schema.Types.ObjectId, ref: 'Image' },
  createdAt: {
    type: Date,
    default: Date.now
  },
  race: String,
  alias: [String],
  images: [{ type: Schema.Types.ObjectId, ref: 'Image' }],
  videos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
  hidden: {
    type: Boolean,
    default: true
  }
});

// Create the Mongoose model for model
const Model = mongoose.model('Model', modelSchema, 'models');

module.exports = Model;
