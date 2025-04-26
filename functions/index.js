const functions = require('firebase-functions');
const cors = require('cors')({origin: true});

// Import core functionality from noise-core.js
const noiseFunctions = require('./noise-core');

exports.generateSound = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }
      
      // Extract parameters from request body
      const params = req.body;
      
      // Validate that we have the necessary parameters
      if (!params || !params.soundType) {
        return res.status(400).send('Invalid parameters');
      }
      
      // Generate the sound using the core library functions
      const result = noiseFunctions.getNoiseFromParams(params);
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error generating sound:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
});

// Additional endpoint to generate a sound key
exports.generateSoundKey = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }
      
      const params = req.body;
      
      // Generate a sound key
      const key = noiseFunctions.generateSoundKey(params);
      
      return res.status(200).json({ key });
    } catch (error) {
      console.error('Error generating sound key:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
});

// Endpoint to get noise from a key
exports.getNoiseFromKey = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
      }
      
      const key = req.query.key;
      
      if (!key) {
        return res.status(400).send('Missing key parameter');
      }
      
      // Get noise from key
      const noise = noiseFunctions.getNoiseFromKey(key);
      
      return res.status(200).json(noise);
    } catch (error) {
      console.error('Error getting noise from key:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
});
