const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs')
const os = require('os');
const path = require('path');
const cors = require('cors');
const axios = require('axios')

// const Model = require('../model-management/models/modelModel');
const { getConfig  } = require('../services/commonServices');
const { fetchAndRenderMedia, fetchAndRenderModels } = require('./controllers/uiController');

const app = express();
const port = process.env.PORT || 3000;
const uri = "mongodb://mongo:27017/<db_name>";


app.locals.parental_advisor_mode = parental_advisor_mode = false ; // Define a shared variable with a default value

// Connect to MongoDB Sharded Cluster
mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });

// Set EJS as the view engine and the directory for views
app.set('view engine', 'ejs');
app.set('views', './views');


// Middleware to modify the request object and add the shared variable
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/local', express.static('/app/ui-frontend/local/'));
app.use((req, res, next) => {
    // Set the shared variable in the request object
    req.parental_advisor_mode = parental_advisor_mode;
    next(); // Call the next middleware in the chain
});


app.get('/', async (req, res) => {
    const parental_advisor_mode = await getConfig();
    const title = "Home Page";
    const mediaType = "model";

    try {
        // Call the Model Service to fetch a random model
        if (parental_advisor_mode === true) {
            const response = await axios.get(`http://model:3001/api/random-model`);
            const randomModel = response.data.randomModel;
            // Render the homepage with the fetched model data
            res.render('homepage', { title, randomModel, mediaType, parental_advisor_mode: parental_advisor_mode });
            
        } else {
            // const response = await axios.get(`http://model:3001/api/search?q=tester`);
            // res.send(response.data.vidUrls)
            fetchAndRenderMedia(req, res, 'movies');
        }

    } catch (error) {
        console.error('Error fetching random model:', error);
        res.status(500).render('homepage', { title, randomModel: [], mediaType, parental_advisor_mode: parental_advisor_mode });
    }
});

app.get('/movies', async (req, res) => fetchAndRenderMedia(req, res, 'movies'));
app.get('/dances', async (req, res) => fetchAndRenderMedia(req, res, 'dances'));
app.get('/gallery', async (req, res) => fetchAndRenderMedia(req, res, 'gallery'));
app.get('/pictures', async (req, res) => fetchAndRenderMedia(req, res, 'pictures'));
app.get('/graphics', async (req, res) => fetchAndRenderMedia(req, res, 'graphics'));
app.get('/models', async (req, res) => fetchAndRenderModels(req, res));
app.get('/listem', async (req, res) => {
    const parental_advisor_mode = await getConfig();
    try {
        const title = "List"
        const response = await axios.get(`http://model:3001/api/listem`);
        const models = response.data
        
        res.render("listem", { title, models, parental_advisor_mode });
    } catch (error) {
        console.error("Error fetching models:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/fav', async (req, res) => {
    const parental_advisor_mode = await getConfig();
    try {
        const title = "Favorites";
        const response = await axios.get(`http://media:3002/api/favorites`);
        const media = response.data;

        // Render the EJS template with data
        res.render("favorites", { title, media, parental_advisor_mode });
    } catch (error) {
        console.error("Error fetching models:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/search', async (req, res) => {
    const parental_advisor_mode = await getConfig();
    const title = 'Search Results';
    const renderPage = 'homepage';
    const mediaType = "search";
    const query = req.query.q.replace(/[^a-zA-Z0-9_.]/g, '');

    try {
        // Call the model server to get the search data
        const response = await axios.get(`http://model:3001/api/search?q=${query}`);
        const { id, name, alias, vidUrls, imgUrls } = response.data;

        // Render the page with data received from the model server
        res.render(renderPage, {
            title,
            mediaType,
            name_of_model: name,
            alias_of_model: alias,
            vUrls: vidUrls,
            iUrls: imgUrls,
            parental_advisor_mode,
            query
        });
    } catch (error) {
        // console.error('Error fetching data from model server:', error);
        res.render(renderPage, { title, mediaType, name_of_model: null, vUrls: [], iUrls: [], parental_advisor_mode, query });
    }
});

// Route to update the mode variable
app.get('/setmode/:value?', (req, res) => {
    // Get the new value from the request parameters and convert it to a boolean
    parental_advisor_mode = req.params.value ? req.params.value:false;

    // Determine the message based on the value of parental_advisor_mode
    if (parental_advisor_mode?.toLowerCase?.() === 'true') {
        var message = 'Welcome to the dark side!'
    } else {
        var message = 'Come to the light'
    }

    // Send a response with a link to go to the home page
    res.send(`
        <p>Mode has been set to: ${parental_advisor_mode}</p>
        <p> ---> <a href="/">${message}</a> <--- </p>
    `);
});

// Route that uses the shared variable
app.get('/mode', (req, res) => {
    res.send(parental_advisor_mode);
});

// Dynamically create routes for statics pages
const renderPage = async (res, page, title = {}) => {
    const parental_advisor_mode = await getConfig();
    res.render(page, { title, parental_advisor_mode });
};
const staticPages = ['createModel', 'deleteModel', 'addMedia', 'deleteMedia', 'downloadPage'];
staticPages.forEach(page => app.get(`/${page}`, (req, res) => renderPage(res, page, `${page.charAt(0).toUpperCase()}${page.slice(1).replace(/([A-Z])/g, ' $1')}`)));



app.post('/download', async (req, res) => {
    const { mediaUrl, newName, folder } = req.body;

    if (!mediaUrl) {
        return res.status(400).send('Media URL is required');
    }

    try {
        // Get the image extension from the URL
        const mediaExtension = path.extname(mediaUrl);
        // Set the image name to either the new name provided or the original name
        const mediaName = newName ? `${newName}${mediaExtension}` : path.basename(mediaUrl);
        
        // Set the folder path, appending to the desktop path if provided
        const defaultPath = path.join(os.homedir(), 'path/to/download/folder');
        const downloadFolder = folder ? path.join(defaultPath, folder) : defaultPath;

        // Define the path to save the image
        const mediaPath = path.join(downloadFolder, mediaName);

        // Fetch the image
        const response = await axios({
            url: mediaUrl,
            method: 'GET',
            responseType: 'stream'
        });

        // Save the image to the specified folder
        const writer = fs.createWriteStream(mediaPath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            res.send(`Media downloaded to ${mediaPath}`);
        });

        writer.on('error', () => {
            res.status(500).send('Error saving the image');
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading the image');
    }
});


// Start server
app.listen(port, () => {
    console.log(`UI app listening at http://localhost:${port}/`)
});
