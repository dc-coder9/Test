const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// API keys for redundancy
const apiKeys = [
  '2982d2e8-2d02-4fc1-8cc4-e5a20c829443',
  '5d2a7711-5ab7-4725-b965-9a8df37989aa',
  '61f02cf0-ca24-4c46-82b4-ef4f0f8660d6'
];

// Supported models
const models = [
  "3Guofeng3_v34.safetensors [50f420de]",
  "absolutereality_V16.safetensors [37db0fc3]",
  "absolutereality_v181.safetensors [3d9d4d2b]",
  "amIReal_V41.safetensors [0a8a2e61]",
  "analog-diffusion-1.0.ckpt [9ca13f02]",
  "aniverse_v30.safetensors [579e6f85]",
  "anythingv3_0-pruned.ckpt [2700c435]",
  "anything-v4.5-pruned.ckpt [65745d25]",
  "anythingV5_PrtRE.safetensors [893e49b9]",
  "AOM3A3_orangemixs.safetensors [9600da17]",
  "blazing_drive_v10g.safetensors [ca1c1eab]",
  "cetusMix_Version35.safetensors [de2f2560]",
  "dreamlike-diffusion-1.0.safetensors [5c9fd6e0]",
  "dreamshaper_6BakedVae.safetensors [114c8abb]",
  "realistic-vision-v5.1.safetensors [a0f13c83]",
  "timeless-1.0.ckpt [7c4971d4]"
];

// Supported aspect ratios
const predefinedRatios = {
  '1:1': [512, 512],
  '16:9': [1920, 1080],
  '4:3': [1024, 768],
  '3:2': [1080, 720],
  '21:9': [2560, 1080]
};

// Route: Welcome
app.get('/', (req, res) => {
  res.send('Welcome to Prodia Image Generation API!');
});

// Route: Generate Image
app.post('/generate-image', async (req, res) => {
  const { prompt, modelIndex, ratio } = req.body;

  // Validate request
  if (!prompt || modelIndex === undefined || !ratio) {
    return res.status(400).json({ error: 'Missing required parameters: prompt, modelIndex, or ratio.' });
  }

  if (modelIndex < 0 || modelIndex >= models.length) {
    return res.status(400).json({ error: 'Invalid modelIndex. Please provide a valid index.' });
  }

  const [width, height] = predefinedRatios[ratio] || ratio.split(':').map(Number);
  if (!width || !height) {
    return res.status(400).json({ error: 'Invalid ratio format. Use predefined like "16:9" or custom like "800:600".' });
  }

  // Attempt with multiple API keys
  let apiIndex = 0;
  while (apiIndex < apiKeys.length) {
    try {
      const response = await axios.post('https://api.prodia.com/v1/sd/generate', {
        model: models[modelIndex],
        prompt,
        negative_prompt: 'badly drawn',
        steps: 50,
        cfg_scale: 8,
        seed: -1,
        upscale: true,
        sampler: 'DPM++ 2',
        width,
        height
      }, {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'X-Prodia-Key': apiKeys[apiIndex]
        }
      });

      // Successful response
      return res.json({ imageUrl: response.data.imageUrl });
    } catch (error) {
      console.error(`Error with API key ${apiKeys[apiIndex]}:`, error.message);
      apiIndex++;
    }
  }

  // All API keys failed
  res.status(500).json({ error: 'All API keys failed or an unexpected error occurred.' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
