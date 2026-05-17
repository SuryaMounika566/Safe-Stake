import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

app.post('/api/verify', async (req, res) => {
    try {
        const { imageUrl, milestoneName, projectTitle } = req.body;
        
        if (!imageUrl || !milestoneName) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        if (!OPENROUTER_API_KEY) {
             return res.status(500).json({ error: "Server missing OPENROUTER_API_KEY in .env" });
        }

        // Fetch the image from URL and convert to base64
        console.log(`Fetching image from: ${imageUrl}...`);
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from URL (Status: ${imageResponse.status})`);
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        if (!mimeType.startsWith('image/')) {
            console.warn(`Warning: fetched content type is ${mimeType}, which might not be a valid image.`);
        }

        const base64Image = buffer.toString('base64');

        const prompt = `You are an AI auditor for a blockchain crowdfunding platform called SafeStake.
Project Title: ${projectTitle}
Claimed Milestone: ${milestoneName}

Analyze the provided image. Does it look like a legitimate piece of proof that the milestone "${milestoneName}" was completed for the project "${projectTitle}"? Or does it look like a fake/stock image? Give a realistic score: a completely irrelevant image gets 0, a stock image gets 20-40, and a genuine milestone photo gets 85-100.

Return your response strictly as a JSON object with two fields (no markdown wrap! just pure JSON):
{"confidence": NUMBER_0_TO_100, "reasoning": "A brief 1-2 sentence explanation of your score."}`;

        console.log(`Verifying: ${imageUrl} against ${milestoneName} using OpenRouter (${OPENROUTER_MODEL})...`);

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://safestake.app',
                'X-OpenRouter-Title': 'SafeStake AI Auditor',
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
            }),
        });

        if (!openRouterResponse.ok) {
            const errorBody = await openRouterResponse.text();
            console.error("OpenRouter API Error:", openRouterResponse.status, errorBody);
            throw new Error(`OpenRouter API error (${openRouterResponse.status}): ${errorBody}`);
        }

        const completion = await openRouterResponse.json();
        
        let textResponse = completion.choices?.[0]?.message?.content || '';
        
        // Clean out markdown wrappers if model includes them
        if (textResponse.includes('```json')) {
            textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (textResponse.includes('```')) {
            textResponse = textResponse.replace(/```/g, '').trim();
        }

        const result = JSON.parse(textResponse);
        console.log("OpenRouter AI Result:", result);

        res.json({
            success: true,
            confidence: result.confidence,
            reasoning: result.reasoning
        });
    } catch (error) {
        console.error("AI Verification Error:", error);
        res.status(500).json({ error: "Failed to verify image with AI: " + error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 AI Proof Verification Oracle running on port ${PORT} (using OpenRouter)`));
