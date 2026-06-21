const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// API Keys
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-15274d6644964070bea6a822b32baaf4";
const TOAPIS_API_KEY = process.env.TOAPIS_API_KEY || "sk-XfnLsW3FKcDnfyfHQvQmHUcSFMnBeqmYlK16YAjtEtdBmZlg";

// API URLs
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const TOAPIS_BASE_URL = "https://toapis.com/v1";

// ==================== TEXT GENERATION ENDPOINT ====================
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model } = req.body;
        
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
        const { prompt, size = "1:1", resolution = "1K", n = 1 } = req.body;

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
        
        // Poll for task completion
        const imageUrl = await pollImageTask(taskId);
        
        res.json({
            success: true,
            taskId: taskId,
            imageUrl: imageUrl,
            prompt: prompt,
            size: size,
            resolution: resolution
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

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, interval));

        } catch (error) {
            if (error.message.includes('Image generation failed')) {
                throw error;
            }
            console.error(`Poll attempt ${attempt + 1} failed:`, error.message);
        }
    }

    throw new Error('Image generation timeout - task did not complete within 120 seconds');
}

// ==================== GET IMAGE TASK STATUS ENDPOINT ====================
app.get('/api/image/status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        const response = await axios.get(
            `${TOAPIS_BASE_URL}/images/generations/${taskId}`,
            {
                headers: {
                    'Authorization': `Bearer ${TOAPIS_API_KEY}`
                }
            }
        );

        res.json(response.data);

    } catch (error) {
        console.error('Error fetching task status:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch task status' });
    }
});

// ==================== HEALTH CHECK ENDPOINT ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Afnan AI Backend is running' });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Afnan AI Backend is running on port ${PORT}`);
    console.log(`✅ DeepSeek API configured`);
    console.log(`✅ ToAPIs Image Generation configured`);
});

module.exports = app;
