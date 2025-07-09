const express = require('express');
const router = express.Router();
const axios = require('axios')
const Model = require('../models/modelModel');
const { delModel, updateModelRef, removingMediaId } = require('../controllers/modelController');
const { getConfig } = require('../../services/commonServices');

router.post('/updateModel/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { name, race, alias, images, videos } = req.body;

    const updatedModel = await Model.findByIdAndUpdate(
      modelId,
      { name, race, alias, images, videos },
      { new: true } // This option returns the updated document
    );

    if (!updatedModel) {
      return res.status(404).send('Model not found');
    }

    res.status(200).json(updatedModel);
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle POST requests to add a new model
router.post('/models', async (req, res) => {
  try {
    // const data = req.body;
    // console.log(data)
    // Extract the entries from the request body
    const entries = await Promise.all(req.body.map(async entry => {
      // Split the title into name and file extension
      var name = entry.name;
      var race = entry.race;
      var alias = entry.alias;

      const model = await new Model({
        name: name,
        race: race,
        alias: alias
      }).save();

      return model
    }));

    res.status(200).json({ message: 'Models added successfully', entries });
  } catch (error) {
    console.error('Error saving models:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle DELETE requests to remove a model
router.delete('/model/:name', async (req, res) => {
  try {
    const { name } = req.params;

    // Delete existing model from database
    await delModel(name);

    // Send a success response with the deleted model
    res.status(201).json({ message: 'Model deleted successfully' });

  } catch (error) {
  console.error(error);
  // Send an error response if something went wrong
  res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/models', async (req, res) => {
  const parental_advisor_mode = await getConfig();
  const { page = 1, limit = 12, letter } = req.query;
  const query = {};

  if (letter) {
      query.name = { $regex: `^${letter}`, $options: 'i' }; // case-insensitive match
  }

  query.hidden = parental_advisor_mode;

  try {
      const models = await Model.find(query).sort({ name: 1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit));

      const totalCount = await Model.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
          data: models,
          totalCount,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit),
      });
  } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/listem', async (req, res) => {
  const parental_advisor_mode = await getConfig();
  try {
    
      const models = await Model.find({ hidden: parental_advisor_mode }); // Fetch all models from the database

      // Sort models alphabetically by name (or any other field)
      models.sort((a, b) => (a.name || 'Unknown').localeCompare(b.name || 'Unknown'));

      res.status(200).json(models);
  } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.get('/search', async (req, res) => {
  try {
      const query = req.query.q.replace(/[^a-zA-Z0-9_.]/g, '');
      const result = await axios.get(`http://media:3002/api/extract-urls/${query}`);
      res.json(result.data); // Send the result in JSON format
  } catch (error) {
      // console.error('Error processing search:', error);
      res.status(500).json({ error: error });
  }
});

router.get('/findmodel/:name', async (req, res) => {
  try {
    const parental_advisor_mode = await getConfig();
    const { name } = req.params;
    let model = await Model.findOne({ name: { $regex: new RegExp(name, 'i') }, hidden: parental_advisor_mode}) || null;
    res.status(200).json(model);
  } catch (error) {
    console.error('Error finding model:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.put('/update-model-ref', async (req, res) => {
  const { modelName, arr, fieldName } = req.body;

  try {
      // Call the update function and send the updated model as a response
      const updatedModel = await updateModelRef(modelName, arr, fieldName);
      res.status(200).json({ message: 'Model updated successfully', updatedModel });
  } catch (error) {
      res.status(500).json({ error: `Error updating model: ${error.message}` });
  }
});

router.get('/random-model', async (req, res) => {
  const parental_advisor_mode = await getConfig();
  try {
      const randomModel = await Model.aggregate([
          { $match: { hidden: parental_advisor_mode } },
          { $sample: { size: 1 } },
          {
              $lookup: {
                  from: "images",
                  localField: "imageThumbnail",
                  foreignField: "_id",
                  as: "imageDetails"
              }
          },
          { $unwind: "$imageDetails" },
          { $project: { name: 1, imageThumbnail: "$imageDetails.imageUrl" } }
      ]);

      if (randomModel.length === 0) {
          return res.status(404).json({ message: 'No models found.' });
      }

      res.status(200).json({ randomModel });
  } catch (error) {
      console.error('Error fetching random model:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create Route for Removing the model ID from all related images and videos
router.put("/remove-mediaId", async (req, res) => {
  const { deletedIds } = req.body;
  try {
    // Call the update function and send the updated model as a response
    const updatedModel = await removingMediaId(deletedIds);
    res.status(200).json({ message: 'Model updated successfully', updatedModel });
  } catch (error) {
      res.status(500).json({ error: `Error updating model: ${error.message}` });
  }
});

module.exports = router;
