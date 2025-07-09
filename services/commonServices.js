const axios = require('axios')

async function getConfig() {
    const response = await axios.get('http://ui:3000/mode');
    return response.data;
}

module.exports = { 
    getConfig
};