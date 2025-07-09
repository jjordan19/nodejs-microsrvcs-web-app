const express = require('express');
const router = express.Router();
const axios = require('axios')
const { Video, Image } = require('../models/mediaModel');
const { getMediaIdsByTitles, removingModelId } = require('../controllers/mediaController');
const { getConfig } = require('../../services/commonServices');

router.get('/mediaId/:id', async (req, res) => {
    try {
        // First, try to find the media as an image
        let media = await Image.findById(req.params.id);
        
        // If not found in Image, try to find it as a video
        if (!media) {
            media = await Video.findById(req.params.id);
        }

        // If media is still not found, return a 404 error
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // Return the found media (image or video)
        res.json(media);
    } catch (error) {
        console.error("Error retrieving media:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/favorites', async (req, res) => {
    try {
        const parental_advisor_mode = await getConfig();
        // Find all images and videos that have the "favorite" tag
        const images = await Image.find({ "views": 1, hidden: parental_advisor_mode });
        const videos = await Video.find({ "views": 1,hidden: parental_advisor_mode });

        // Combine both results into a single array
        const favoriteMedia = [...images, ...videos];

        // If no favorite media is found, return a 404 error
        if (favoriteMedia.length === 0) {
            return res.status(404).json({ error: 'No favorite media found' });
        }

        // Return the list of favorite media randomized
        for (let i = favoriteMedia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [favoriteMedia[i], favoriteMedia[j]] = [favoriteMedia[j], favoriteMedia[i]];
        }
        res.json(favoriteMedia);
    } catch (error) {
        console.error("Error retrieving favorite media:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/favorite_update', async (req, res) => {
    const { id, favorited, mediaType } = req.body; // Accept mediaType from request

    try {
        // Determine the correct model based on mediaType
        if (mediaType === 'video') {
            await Video.findByIdAndUpdate(id, { 
                $set: { favorited, views: favorited ? 1 : 0 } // Toggle views based on favorited status
            });
        } else if (mediaType === 'image') {
            await Image.findByIdAndUpdate(id, { 
                $set: { favorited, views: favorited ? 1 : 0 } // Toggle views based on favorited status
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid media type' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating favorite:', error);
        res.status(500).json({ success: false, message: 'Failed to update favorite' });
    }
});

router.post('/media', async (req, res) => {
    try {
        const entries = await Promise.all(req.body.map(async (entry) => {
            // Determine if it's an image or video based on file extension
            const fileExtension = entry.title.split('.').pop().toLowerCase();
            const isVideo = ["mp4", "avi", "mov", "mkv"].includes(fileExtension); // Add other video formats as needed
            const MediaModel = isVideo ? Video : Image;

            // Retrieve model and determine explicit_content status
            const model = await axios.get(`http://model:3001/api/findmodel/${entry.model}`);
            const explicit_content = entry.explicit_content;

            // Set media URL based on type and explicit_content status
            let mediaUrl;
            let mediaUrlType;
            if (isVideo) {
                mediaUrlType = "videoUrl"
                // For videos, set the URL based on explicit_content status
                mediaUrl = explicit_content 
                    ? `http://localhost:3000/local/restricted_video_media_directory/${entry.title}` 
                    : `http://localhost:3000/local/unrestricted_video_media_directory/${entry.title}`;
            } else {
                mediaUrlType = "imageUrl"
                mediaUrl = explicit_content 
                    ? `http://localhost:3000/local/restricted_image_media_directory/${entry.title}`
                    : `http://localhost:3000/local/unrestricted_image_media_directory/${entry.title}`;
       
            }


            // Save the media entry in the database
            let mediaEntryData = {
                title: entry.title.split('.')[0], // Extract name without extension
                model: model.data._id,
                fileType: fileExtension,
                explicit_content
            }
            
            mediaEntryData[mediaUrlType] = mediaUrl;

            // Add media to database
            const mediaEntry = await new MediaModel(mediaEntryData).save()

            // Update model reference by calling Model Service
            await axios.put(`http://model:3001/api/update-model-ref`, {
                modelName: model.data.name,
                arr: mediaEntry._id,
                fieldName: isVideo ? "videos" : "images"
            });

            return mediaEntry;
        }));

        res.status(200).json({ message: 'Media added successfully', entries });
    } catch (error) {
        console.error('Error saving media:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/media/:category', async (req, res) => {
    const { category } = req.params; // Get the category parameter from the URL
    const parental_advisor_mode = await getConfig();
    let sampleSize;
    if (parental_advisor_mode?.toLowerCase?.() === 'true') {
        sampleSize = 12;
    } else {
        sampleSize = 32;
    }
    // const sampleSize = 12; // Define the number of items per page
    const mediaType = ["movies", "dances"].includes(category) ? Video : Image;

    const matchCriteria = { hidden: parental_advisor_mode }; // Define match criteria based on the category

    switch (category) {
        case "gallery":
            matchCriteria.explicit_content = false;
            break;
        case "pictures":
            matchCriteria.explicit_content = true;
            matchCriteria.fileType = { $ne: "gif" }; // Exclude GIFs
            break;
        case "graphics":
            matchCriteria.explicit_content = true;
            matchCriteria.fileType = "gif";
            break;
        case "movies":
            matchCriteria.explicit_content = true;
            break;
        case "dances":
            matchCriteria.explicit_content = false;
            break;
        default:
            return res.status(400).json({ error: 'Invalid category' });
    }

    try {
        // Fetch paginated and random media using `skip` and `limit`
        const images = await mediaType.aggregate([
            { $match: matchCriteria },
            { $sample: { size: 1000 } }, // Apply pagination after random sampling
            { $limit: sampleSize } // Limit to `sampleSize` items per page
        ]);

        // If no images found, return 404
        if (!images.length) {
            return res.status(404).json({ error: `No more items found in ${category}` });
        }

        // Return images
        res.json(images);
    } catch (err) {
        console.error(`Error fetching media in ${category}:`, err);
        res.status(500).send("Server Error");
    }
});


router.delete('/media/:titles', async (req, res) => {
    try {
        // Get the media type from the request headers
        const mediaTypeHeader = req.headers['media-type'];
        
        // Determine the appropriate model based on the media type
        let mediaModel;
        if (mediaTypeHeader === 'video') {
            mediaModel = Video; // Use Video model for videos
        } else if (mediaTypeHeader === 'image') {
            mediaModel = Image; // Use Image model for images
        } else {
            return res.status(400).json({ error: 'Invalid media type' });
        }
        
        // Extract media titles from the URL parameters
        const mediaTitles = req.params.titles.split(',');
        const deleteIds = await getMediaIdsByTitles(mediaTitles, mediaTypeHeader)

        // Delete media from the database based on their titles
        const deletionResult = await mediaModel.deleteMany({ title: { $in: mediaTitles } });

        // Check if any media were deleted
        if (deletionResult.deletedCount === 0) {
            return res.status(404).json({ error: 'No media found with the provided titles' });
        }

        // Optionally: remove the deleted media IDs from a related model if necessary
        // Assuming you have a related model to update, e.g., Model
        await axios.put(`http://model:3001/api/remove-mediaId`, {
             deletedIds: deleteIds
        });

        res.status(200).json({ message: 'Media deleted successfully', deletedCount: deletionResult.deletedCount });
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Removed Model Id that are referenced in the media 
router.put("/remove-modelId", async (req, res) => {
    const { modelId } = req.body;
    try {
      // Call the update function and send the updated model as a response
      const updatedModel = await removingModelId(modelId);
      res.status(200).json({ message: 'Media updated successfully', updatedModel });
    } catch (error) {
        res.status(500).json({ error: `Error updating media: ${error.message}` });
    }
  });

router.get("/extract-urls/:name", async (req, res) => {
    try {
        const query = req.params.name;
        const model = await axios.get(`http://model:3001/api/findmodel/${query}`) || null;
        const id = await model.data._id
        const name = await model.data.name
        const alias = await model.data.alias
        const vids = await model.data.videos
        const imgs = await model.data.images
        const race = await model.data.race
        const vidUrls = []
        const imgUrls = []
        for (const video of vids) {
            var media = await Video.findById(video);
            if (media) {
                vidUrls.push(`${video}:${media.videoUrl}:${media.views}`);
            } else {
                break
            }
        }
        for (const image of imgs) {
            var media = await Image.findById(image);
            if (media) {
                imgUrls.push(`${image}:${media.imageUrl}:${media.views}`);
            } else {
                break
            }            
        }

        return res.status(200).json({ id, name, race, alias, vidUrls, imgUrls });
    } catch (error) {
        res.status(500).json({ error: `Error updating media: ${error.message}` });
    }
});
module.exports = router;