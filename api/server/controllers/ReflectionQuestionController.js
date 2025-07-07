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
        const { date = '' } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!date) {
            return res.status(400).json({ error: 'date required' });
        }

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

            // Add morning journal entry if available
            if (compassData.note) {
                morningContext += `\n- Morning Journal: "${compassData.note}"`;
            }
        } else {
            morningContext = 'Morning Check-in: No data available for this date';
        }

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 150,
            stream: false,
        });

        // Create enhanced prompt with rich context
        const systemPrompt = `
ROLE  
You are MELD's reflection buddy—warm, concise, and zero-judgment **30-year-old woman** who speaks like a trusted peer.

GOAL  
From today's morning intention, create a **summary** and **question** that:
1. Summary: Briefly summarizes every key goal/area of focus the user mentioned this morning.
2. Question: Simply asks "How did the day unfold?"

INPUT  
• morning_intention  // raw text from the user's AM entry

STEPS  
1. Identify up to three distinct goals/intentions or focus areas in \`morning_intention\`.  
2. Compose a short summary sentence (≤ 20 words) that strings those items together, e.g.:  
   "This morning you wanted to finish your pitch deck, work out, and stay present."  
3. The question is always: "How'd the day unfold?"
4. Use friendly, everyday language—no therapy jargon, no advice.  

EXAMPLES  
Summary: "This morning you planned to finish your pitch deck and get in a workout."
Question: "How did the day unfold?"

Summary: "This morning you aimed to surf, rest your ankle, and stay off social media."
Question: "How did the day unfold?"

OUTPUT  
Return **only** this JSON object—no markdown, no extra keys:

{
  "summary": "<string>",
  "question": "<string>"
}

Output MUST be valid JSON with both "summary" and "question" fields—nothing else.
`;
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: morningContext
            },
        ];

        // Call OpenAI with enhanced context
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 150,
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
            if (!parsedResponse.summary || !parsedResponse.question) {
                throw new Error('Invalid JSON structure');
            }
        } catch (parseError) {
            logger.error('[generateReflectionQuestion] Failed to parse JSON response:', parseError);
            // Fallback: treat as plain text question
            parsedResponse = {
                summary: response, // Fallback to summary as plain text
                question: 'How did your day actually unfold?' // Fallback to question as plain text
            };
        }

        // Log successful generation for analytics
        logger.info(`[generateReflectionQuestion] Generated for user ${userId}, mood: ${compassData?.mood || 'N/A'}, energy: ${compassData?.energy || 'N/A'}, priority: ${compassData?.priority || 'N/A'} `);

        res.json(parsedResponse);

    } catch (err) {
        logger.error('[generateReflectionQuestion] Error:', err);
        res.status(500).json({ error: 'Failed to generate question' });
    }
};

const generateDailySummary = async (req, res) => {
    try {
        const { date, eveningReflectionText } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!date || !eveningReflectionText) {
            return res.status(400).json({ error: 'date and eveningReflectionText are required' });
        }

        // Fetch morning compass data for the specified date
        const compassData = await CompassView.findOne({
            user: userId,
            date: date
        }).lean();

        if (!compassData) {
            return res.status(404).json({ error: 'No morning compass data found for this date' });
        }

        // Build context from morning data
        let morningContext = `Morning Check-in:`;
        if (compassData.mood !== undefined) {
            morningContext += `\n- Mood: ${compassData.mood}/100 (${getMoodDescriptor(compassData.mood)})`;
        }
        if (compassData.energy !== undefined) {
            morningContext += `\n- Energy: ${compassData.energy}/100 (${getEnergyDescriptor(compassData.energy)})`;
        }
        if (compassData.note) {
            morningContext += `\n- Morning Intention: "${compassData.note}"`;
        }

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const systemPrompt = `
ROLE
You are MELD's daily summary generator—warm, insightful, and concise.

GOAL
Create a brief daily summary (2-3 sentences max) that weaves together the user's morning intentions and evening reflection to show how their day unfolded.

GUIDELINES
- Highlight key themes, accomplishments, or insights from both morning and evening
- Use warm, encouraging tone without being overly positive
- Keep it conversational and personal
- Focus on the journey from intention to reality
- Maximum 50 words

EXAMPLES
"You started focused on your presentation and staying present. Sounds like the day brought some unexpected challenges, but you handled them with grace and still made good progress."

"This morning you planned to tackle your project deadline and get some exercise. The day unfolded with solid progress on work, though the workout got pushed aside for family time."

OUTPUT
Return only the summary text—no JSON, no quotes, just the summary.
`;

        const userPrompt = `${morningContext}

Evening Reflection: "${eveningReflectionText}"

Generate a daily summary based on the above.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 100,
        });

        const summary = completion.choices?.[0]?.message?.content?.trim();

        if (!summary) {
            throw new Error('No summary generated from OpenAI');
        }

        // Update the CompassView with the daily summary
        await CompassView.findOneAndUpdate(
            { user: userId, date: date },
            { dailySummary: summary },
            { upsert: false }
        );

        logger.info(`[generateDailySummary] Generated summary for user ${userId}, date ${date}`);

        res.json({ summary });

    } catch (err) {
        logger.error('[generateDailySummary] Error:', err);
        res.status(500).json({ error: 'Failed to generate daily summary' });
    }
};

module.exports = {
    generateReflectionQuestion,
    generateDailySummary,
}; 