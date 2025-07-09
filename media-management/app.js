const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mediaRoutes = require('./routes/mediaRoutes');

const app = express();
// const port = process.env.PORT || 3002;
const port = 3002
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
app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', mediaRoutes);


// Start server
app.listen(port, () => {
    console.log(`Media app listening at http://localhost:${port}/`)
});
