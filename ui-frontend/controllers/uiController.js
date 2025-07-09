const axios = require('axios')

const { getConfig  } = require('../../services/commonServices');

async function fetchDataAndRender(req, res, query, page, title, mediaType, parental_advisor_mode) {
    try {
        // const data = await query.exec();
        const parental_advisor_mode = await getConfig();
        const data = await query;
        res.render(page, { title, data, mediaType, parental_advisor_mode });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
}

const fetchAndRenderMedia = async (req, res, mediaType) => {
    const parental_advisor_mode = await getConfig();
    const title = `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Page`; // Capitalize the first letter
    const renderPage = 'homepage';
    const imageServerUrl = `http://media:3002/api/media/${mediaType}`; // Adjust URL and port as necessary

    try {
        const response = await axios.get(imageServerUrl);
        const media = response.data; // Assuming the image server returns the images in the correct format

        // Render the page with the fetched media
        fetchDataAndRender(req, res, media, renderPage, title, mediaType, parental_advisor_mode);
    } catch (error) {
        console.error(`Error fetching media from the media server for ${mediaType}:`, error);
        res.status(500).send(`Error fetching ${mediaType} data`);
    }
};

const fetchAndRenderModels = async (req, res) => {
    const title = "Models Page";
    const renderPage = 'modelsPage';
    const parental_advisor_mode = await getConfig();
    const { page = 1, limit = 12, letter } = req.query;

    try {
        const response = await axios.get(`http://model:3001/api/models`, {
            params: { page, limit, letter, parental_advisor_mode }
        });

        const { data, totalPages, currentPage } = response.data;

        res.render(renderPage, {
            title,
            mediaType: "model",
            data,
            currentPage,
            totalPages,
            limit: parseInt(limit),
            letter,
            parental_advisor_mode
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).send("Error loading models page.");
    }
};


  module.exports = { fetchAndRenderMedia, fetchAndRenderModels };