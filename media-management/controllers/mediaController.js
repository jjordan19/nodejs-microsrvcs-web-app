const { Image, Video } = require('../models/mediaModel')

async function getMediaIdsByTitles(imageTitles, format) {
    try {
      const imageIds = [];
      for (const title of imageTitles) {
        if (format === "image") {
            var media = await Image.findOne({ title });
        } else if (format === 'video') {
            var media = await Video.findOne({ title });
        }
        if (media) {
          imageIds.push(media._id);
        }
      }
      return imageIds;
    } catch (error) {
      console.error('Error retrieving image IDs:', error);
      throw error;
    }
}

async function removingModelId(modelId) {
  try {
    await Image.updateMany({ $unset: { modelId: modelId } }) || null;
  } catch (error) {
      console.error('Error deleting model and image references:', error);
    
  }

  try {
    await Video.updateMany({ $unset: { modelId: modelId } })|| null;
  } catch (error) {
      console.error('Error deleting model and video references:', error);
  }
}


  module.exports = { getMediaIdsByTitles, removingModelId };