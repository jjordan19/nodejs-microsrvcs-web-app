const Model = require('../models/modelModel');
const axios = require('axios')
const { getConfig  } = require('../../services/commonServices');

// delete Model
async function delModel(modelName) {
    try {
        // Get Model by name
        const model = await Model.findOne({ name: modelName });
        model === null ? (() => { throw new Error('Variable is null'); })() : model;

        // Delete any reference associated with the model id to any type of media
        await axios.put(`http://media:3002/api/remove-modelId`, {
            modelId: model._id
        });

        // Delete Model
        try {
            await Model.findByIdAndDelete(model._id)
        } catch (error) {
            console.error('Error deleting model:', error);
        }

    } catch (error) {
        console.error('Error:', error);
        // throw new Error('Error deleting model and references.');
    }
}

async function updateModelRef(modelName, arr, fieldName) {
    try {
        const updateQuery = { $push: { [fieldName]: arr } };
        const model = await Model.findOneAndUpdate(
            { name: modelName },
            updateQuery,
            { new: true }
        );
        if (!model) {
            throw new Error(`Model '${modelName}' not found`);
        }
        return model;
    } catch (error) {
        console.error(`Error updating model ${fieldName}:`, error);
        throw error;
    }
}

async function removingMediaId(deleteIds) {
    try {
        await Model.updateMany(
            { $or: [{ images: { $in: deleteIds } }, { videos: { $in: deleteIds } }] },
            { $pull: { images: { $in: deleteIds }, videos: { $in: deleteIds } } }
        );
    } catch (error) {
        console.error(`Error removing media Id ${deleteIds}:`, error);
        throw error;
    }
}

module.exports = { delModel, updateModelRef, removingMediaId };