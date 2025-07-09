const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for images
const imageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  model: { 
    type: Schema.Types.ObjectId, 
    ref: 'Model' 
  },
  explicit_content: {
    type: Boolean,
  },
  fileType: String,
  categories: String,
  views: {
    type: Number,
    default: 0
  },
  hidden: {
    type: Boolean,
    default: true
  }
});

const videoSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    description: String,
    videoUrl: {
      type: String,
      required: true,
      unique: true
    },
    model: {
      type: Schema.Types.ObjectId,
      ref: 'Model'
    },
    videoThumbnail: String,
    categories: String,
    tags: [String],
    duration: Number,
    fileSize: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    fileType: String,
    views: Number,
    explicit_content: {
      type: Boolean
    },
    hidden: {
      type: Boolean,
      default: true
    }
});
  
// Create the Mongoose model for video and images
const Video = mongoose.model('Video', videoSchema, 'videos');
const Image = mongoose.model('Image', imageSchema, 'images');

module.exports = { Image, Video };