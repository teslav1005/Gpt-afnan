const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // زيادة الحد لدعم الصور بصيغة base64

// API Keys
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-15274d6644964070bea6a822b32baaf4";
const TOAPIS_API_KEY = process.env.TOAPIS_API_KEY || "sk-XfnLsW3FKcDnfyfHQvQmHUcSFMnBeqmYlK16YAjtEtdBmZlg";

// API URLs
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const TOAPIS_BASE_URL = "https://toapis.com/v1";

// ==================== TEXT & VISION ENDPOINT ====================
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        // DeepSeek V3/V4 supports vision and file analysis through multimodal messages
        const response = await axios.post(DEEPSEEK_API_URL, {
            model: "deepseek-chat",
            messages: messages,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error with DeepSeek API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch from DeepSeek API' });
    }
});

// ==================== IMAGE GENERATION ENDPOINT ====================
app.post('/api/image', async (req, res) => {
    try {
        const { prompt, size = "1:1", resolution = "1K", n = 1, reference_images = [] } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Submit image generation task
        const response = await axios.post(
            `${TOAPIS_BASE_URL}/images/generations`,
            {
                model: "gpt-image-2",
                prompt: prompt,
                size: size,
                resolution: resolution,
                n: n,
                reference_images: reference_images, // Support for Image-to-Image if provided
                response_format: "url"
            },
            {
                headers: {
                    'Authorization': `Bearer ${TOAPIS_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const taskId = response.data.id;
        const imageUrl = await pollImageTask(taskId);
        
        res.json({
            success: true,
            imageUrl: imageUrl,
            taskId: taskId
        });

    } catch (error) {
        console.error('Error with ToAPIs Image Generation:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// ==================== POLL IMAGE TASK COMPLETION ====================
async function pollImageTask(taskId, maxAttempts = 60, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await axios.get(
                `${TOAPIS_BASE_URL}/images/generations/${taskId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${TOAPIS_API_KEY}`
                    }
                }
            );

            const { status, result, error } = response.data;

            if (status === 'completed' && result && result.data && result.data[0]) {
                return result.data[0].url;
            } else if (status === 'failed') {
                throw new Error(`Image generation failed: ${error?.message || 'Unknown error'}`);
            }

            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            if (error.message.includes('Image generation failed')) throw error;
        }
    }
    throw new Error('Image generation timeout');
}

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});

module.exports = app;
