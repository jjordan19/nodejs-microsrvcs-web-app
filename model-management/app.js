const express = require('express');
const mongoose = require('mongoose');
const modelRoutes = require('./routes/modelRoutes');
const cors = require('cors')

const app = express();
const port = process.env.PORT || 3001;
const uri = "mongodb://mongo:27017/<db_name>";

// Connect to MongoDB Sharded Cluster
mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });

// Middleware
app.use(express.json());
app.use(cors())

// Routes
app.use('/api', modelRoutes);

// Start server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}/`)
});
