const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Keys
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || "sk_ImnwwVCJpg53tjNtxuxUIfvwr3Nkk2XM";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-15274d6644964070bea6a822b32baaf4";

// Base URLs
const POLLINATIONS_BASE_URL = "https://gen.pollinations.ai";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// ==================== TEXT GENERATION (OpenAI Compatible) ====================
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model = "openai" } = req.body;
        
        // Map frontend model names to Pollinations/DeepSeek model names
        let targetModel = model;
        if (model.includes("DeepSeek")) targetModel = "deepseek";
        else if (model.includes("GPT")) targetModel = "openai";
        else if (model.includes("Gemini")) targetModel = "gemini";
        else if (model.includes("Claude")) targetModel = "claude";
        else if (model.includes("Kimi")) targetModel = "kimi";

        const response = await axios.post(`${POLLINATIONS_BASE_URL}/v1/chat/completions`, {
            model: targetModel,
            messages: messages,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${POLLINATIONS_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Text Generation Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate text' });
    }
});

// ==================== IMAGE GENERATION ====================
app.post('/api/image', async (req, res) => {
    try {
        const { prompt, model = "flux", size = "1:1", n = 1 } = req.body;
        
        // Map frontend model names
        let targetModel = "flux";
        if (model === "Nano Banana 2") targetModel = "nanobanana-2";
        else if (model === "GPT Image 2") targetModel = "gpt-image-2";

        // Pollinations image generation is via GET
        // Format: https://gen.pollinations.ai/image/{prompt}?model={model}&width={w}&height={h}
        // We'll return the URL directly as Pollinations is fast and doesn't always need async for simple images
        const [width, height] = parseSize(size);
        const imageUrl = `${POLLINATIONS_BASE_URL}/image/${encodeURIComponent(prompt)}?model=${targetModel}&width=${width}&height=${height}&n=${n}&key=${POLLINATIONS_API_KEY}`;

        res.json({ success: true, imageUrl: imageUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// ==================== VIDEO GENERATION ====================
app.post('/api/video', async (req, res) => {
    try {
        const { prompt, model = "wan", duration = 4, size = "16:9" } = req.body;

        // Map frontend model names to Pollinations models
        let targetModel = "wan";
        if (model.includes("Veo")) targetModel = "veo";
        else if (model.includes("LTX")) targetModel = "ltx-2";
        else if (model.includes("Wan")) targetModel = "wan-pro";
        else if (model.includes("Seedance")) targetModel = "seedance-pro";
        else if (model.includes("Nova")) targetModel = "nova-reel";

        // Video generation URL
        const videoUrl = `${POLLINATIONS_BASE_URL}/video/${encodeURIComponent(prompt)}?model=${targetModel}&duration=${duration}&size=${size}&key=${POLLINATIONS_API_KEY}`;

        res.json({ success: true, videoUrl: videoUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate video' });
    }
});

// Helper to parse aspect ratio to dimensions
function parseSize(size) {
    const map = {
        "1:1": [1024, 1024],
        "16:9": [1536, 864],
        "9:16": [864, 1536],
        "4:3": [1024, 768],
        "3:4": [768, 1024],
        "21:9": [1536, 640]
    };
    return map[size] || [1024, 1024];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Pollinations Backend running on port ${PORT}`);
});

module.exports = app;
