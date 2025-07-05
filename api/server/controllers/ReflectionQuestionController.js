const { OpenAI } = require('openai');
const { logger } = require('~/config');
const User = require('~/models/User');
const CompassView = require('~/models/CompassView');
const { EMOTIONAL_STATES, PRIORITY_LABELS } = require('~/lib/constants/reflection-constants');

// Helper to get mood/energy descriptors
const getMoodDescriptor = (mood) => {
    if (mood >= 80) return 'very positive';
    if (mood >= 60) return 'good';
    if (mood >= 40) return 'neutral';
    if (mood >= 20) return 'low';
    return 'very low';
};

const getEnergyDescriptor = (energy) => {
    if (energy >= 80) return 'very high';
    if (energy >= 60) return 'high';
    if (energy >= 40) return 'moderate';
    if (energy >= 20) return 'low';
    return 'very low';
};

const generateReflectionQuestion = async (req, res) => {
    try {
        const { date = '', topics = [] } = req.body;
        const userId = req.user.id;

        // Validate topics array (now handling emotional states)
        if (!Array.isArray(topics) || !topics.length) {
            return res.status(400).json({ error: 'topics array required' });
        }

        // Check if it's a predefined emotional state or custom emotion
        const firstTopic = topics[0];
        const emotionalState = EMOTIONAL_STATES[firstTopic];

        // If it's not a predefined state, treat it as a custom emotion
        const isCustomEmotion = !emotionalState;
        const customEmotionText = isCustomEmotion ? firstTopic : null;

        // Fetch user profile data
        const user = await User.findById(userId).select('name email role createdAt').lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch morning compass data for the specified date
        const compassData = await CompassView.findOne({
            user: userId,
            date: date
        }).lean();

        // Build comprehensive context for AI
        let userContext = `User Profile:
- Name: ${user.name || 'User'}
- Account created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}`;

        let morningContext = `Today is ${date}`;
        if (compassData) {
            morningContext = `Morning Check-in Data:`;

            if (compassData.mood !== undefined) {
                morningContext += `\n- Mood: ${compassData.mood}/100 (${getMoodDescriptor(compassData.mood)})`;
            }

            if (compassData.energy !== undefined) {
                morningContext += `\n- Energy: ${compassData.energy}/100 (${getEnergyDescriptor(compassData.energy)})`;
            }

            if (compassData.priority) {
                const priorityLabel = PRIORITY_LABELS[compassData.priority] || compassData.priority;
                morningContext += `\n- Top Priority: ${priorityLabel}`;
            }

            if (compassData.priorityNote) {
                morningContext += `\n- Priority Details: "${compassData.priorityNote}"`;
            }
        } else {
            morningContext = 'Morning Check-in: No data available for this date';
        }

        // Build evening emotional context
        let eveningContext = '';
        if (emotionalState) {
            // Predefined emotional state
            eveningContext = `Evening Emotional State:
- How they described their day: "${emotionalState.label}" - ${emotionalState.description}`;
        } else if (customEmotionText) {
            // Custom emotion provided by user
            eveningContext = `Evening Emotional State:
- How they described their day: "${customEmotionText}" (their own words)`;
        }

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-4o',
            temperature: 1.5,
            max_tokens: 150, // Increased for two questions
            stream: false,
        });

        // Create enhanced prompt with rich context
        const systemPrompt = `
You're MELD's reflection buddy—an insightful, empathetic mentor in her mid-30s who's successful, grounded, knows her well, and genuinely believes in her.

Return a JSON object:

{
"question": "Warm acknowledgment of today's feeling, then a reflective question inviting vivid description or thoughtful exploration of its cause. Mention her morning intention only if there's a notable mismatch or insight.",
"prompt": "Supportive follow-up question offering gentle introspection or actionable clarity for tomorrow or the week ahead."
}

## For a CHALLENGING feeling
1. Acknowledge their feeling.
2. Invite deeper reflection using descriptive, scene-setting verbs: "Trace," "Unpack," "Replay," "Pinpoint," "Walk me through."
3. Suggest one gentle, practical shift.

## For a POSITIVE feeling
1. Celebrate sincerely and vary expressions.
2. Prompt vivid revisiting of highlight using varied verbs: "Replay," "Sketch," "Revisit," "Describe," "Walk me through."
3. Encourage integration of insights moving forward.

### Style & Tone Guidelines
• 1 sentence per response (except feeling acknowledgment), ≤ 15 words each.
• Rotate openings—no repetitive phrases.
• Use varied, vivid, descriptive verbs.
• Avoid superficial cheerleading ("You lit it up!") and clichés.
• Keep voice grounded, authentic, empathetic—like a supportive older sister.
• Reference morning intentions ONLY if naturally insightful or relevant—avoid forced mentions.
• Prioritize MELD language: clarity, grounded, rising, story, direction.
• Strictly avoid hustle or productivity jargon ("optimize," "hack," etc.).

Output ONLY valid JSON, no markdown, no extra keys.
`;

        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'assistant',
                content: 'What do you want to accomplish today?'
            },
            {
                role: 'user',
                content: morningContext
            },
            {
                role: 'assistant',
                content: 'How did you feel today?'
            },
            {
                role: 'user',
                content: eveningContext
            },
        ];

        // Call OpenAI with enhanced context
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 150, // Increased for two questions
            stream: false,
        });

        const response = completion.choices?.[0]?.message?.content?.trim();

        if (!response) {
            throw new Error('No content from OpenAI');
        }

        // Parse JSON response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(response);
            if (!parsedResponse.question || !parsedResponse.prompt) {
                throw new Error('Invalid JSON structure');
            }
        } catch (parseError) {
            logger.error('[generateReflectionQuestion] Failed to parse JSON response:', parseError);
            // Fallback: treat as plain text question
            parsedResponse = {
                question: response,
                prompt: "What's one small thing you could do tomorrow to build on today's experience?"
            };
        }

        // Log successful generation for analytics
        const logContext = emotionalState
            ? `emotional state: ${emotionalState.label}`
            : `custom emotion: ${customEmotionText}`;

        logger.info(`[generateReflectionQuestion] Generated for user ${userId}, ${logContext}, mood: ${compassData?.mood || 'N/A'}, energy: ${compassData?.energy || 'N/A'}`);

        res.json(parsedResponse);

    } catch (err) {
        logger.error('[generateReflectionQuestion] Error:', err);
        res.status(500).json({ error: 'Failed to generate question' });
    }
};

module.exports = {
    generateReflectionQuestion,
}; 