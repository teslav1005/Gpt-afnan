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
        const { messages, model = "deepseek-v4-flash" } = req.body;
        
        // Map frontend model names to Pollinations/DeepSeek model names as requested
        let targetModel = "deepseek";
        if (model === "deepseek-v4-flash") targetModel = "deepseek";
        else if (model === "deepseek-v4-pro") targetModel = "deepseek-reasoner";
        else if (model === "minimax-m2.7") targetModel = "minimax";
        else if (model === "claude-4.8") targetModel = "claude"; // In backend it's claude-large
        else if (model === "gemini-3.1-pro") targetModel = "gemini"; // In backend it's gemini-large
        else if (model === "kimi-2.7") targetModel = "kimi"; // In backend it's kimi-code
        else if (model === "gpt-5.5") targetModel = "openai"; // In backend it's openai-large
        else if (model === "perplexity-reasoning") targetModel = "p-search";

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
        const { prompt, model = "flux", size = "1:1", n = 1, images = [] } = req.body;
        
        let targetModel = "flux";
        if (model === "nanobanana-2" || model === "Nano Banana 2") targetModel = "nanobanana-2";
        else if (model === "gpt-image-2" || model === "GPT Image 2") targetModel = "gpt-image-2";
        else if (model === "flux") targetModel = "flux";

        const [width, height] = parseSize(size);
        let imageUrl = `${POLLINATIONS_BASE_URL}/image/${encodeURIComponent(prompt)}?model=${targetModel}&width=${width}&height=${height}&n=${n}&key=${POLLINATIONS_API_KEY}`;
        
        res.json({ success: true, imageUrl: imageUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// ==================== VIDEO GENERATION ====================
app.post('/api/video', async (req, res) => {
    try {
        const { prompt, model = "wan", duration = 4, size = "16:9", startImage = null, endImage = null } = req.body;

        let targetModel = "wan-pro";
        if (model === "veo") targetModel = "veo";
        else if (model === "ltx-2") targetModel = "ltx-2";
        else if (model === "wan-pro") targetModel = "wan-pro";
        else if (model === "seedance-2.0") targetModel = "seedance-pro";
        else if (model === "p-video-720p") targetModel = "p-video-720p";

        let videoUrl = `${POLLINATIONS_BASE_URL}/video/${encodeURIComponent(prompt)}?model=${targetModel}&duration=${duration}&size=${size}&key=${POLLINATIONS_API_KEY}`;
        
        if (startImage) videoUrl += `&start_image=${encodeURIComponent(startImage)}`;
        if (endImage) videoUrl += `&end_image=${encodeURIComponent(endImage)}`;

        res.json({ success: true, videoUrl: videoUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate video' });
    }
});

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
