// src/controllers/MentorInterestController.js

const axios = require('axios');
const { logger } = require('~/config');
const MentorQuestion = require('../../models/MentorQuestion');
const MentorInterest = require('../../models/MentorInterest');
const { mentorQuestionSchema, mentorInterestSchema } = require('~/validation/mentorInterest');
const { handleError } = require('../utils');
const FormData = require('form-data');
const MENTOR_QUESTIONS_INDEX = 'mentor_questions';
const MentorResponse = require('../../models/MentorResponse');
const OpenAI = require('openai');

/**
 * Store (or re-store) a question embedding in the RAG API by uploading it
 * as a "file" in multipart/form-data.  This matches the way LibreChat's
 * uploadVectors tool works.
 *
 * @param {string} question   The question text
 * @param {string} pillar     The pillar of the question
 * @param {string[]} subTags  The sub-tags of the question
 * @param {string} question_id The ID of the question to use as entity_id
 * @param {import('express').Request} req
 */
async function storeQuestionInRAG(question, pillar, subTags, question_id, req) {
  if (!process.env.RAG_API_URL) {
    throw new Error('RAG_API_URL not defined');
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.debug('[storeQuestionInRAG] Missing or invalid Authorization header', {
      headers: req.headers,
    });
    throw new Error('User not authenticated');
  }
  const jwtToken = authHeader.split(' ')[1];

  const formData = new FormData();
  formData.append('file_id', question_id);
  formData.append('file', Buffer.from(question, 'utf-8'), {
    filename: `question_${question_id}.txt`,
    contentType: 'text/plain',
  });
  formData.append('entity_id', MENTOR_QUESTIONS_INDEX);
  formData.append('model', 'text-embedding-3-small');
  formData.append('metadata', JSON.stringify({ pillar, subTags }));

  const headers = {
    Authorization: `Bearer ${jwtToken}`,
    accept: 'application/json',
    ...formData.getHeaders(),
  };

  const response = await axios.post(`${process.env.RAG_API_URL}/embed`, formData, { headers });

  if (!response.data.status) {
    logger.debug('[storeQuestionInRAG] RAG API returned error status', {
      status: response.status,
      body: response.data,
    });
    throw new Error('Failed to store question in RAG API');
  }

  logger.debug('[storeQuestionInRAG] Successfully stored question embedding', {
    status: response.status,
    data: response.data,
  });
}

/**
 * Search embeddings in RAG API.
 * @param {string} query
 * @param {number} k
 * @returns {Promise<Array<{ file_id: string; similarity: number }>>}
 */
async function searchQuestionsInRAG(req, query, k = 30) {
  if (!process.env.RAG_API_URL) {
    logger.error('[searchQuestionsInRAG] RAG_API_URL environment variable is not defined');
    throw new Error('RAG_API_URL not defined');
  }

  const url = `${process.env.RAG_API_URL}/query`;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.debug('[storeQuestionInRAG] Missing or invalid Authorization header', {
      headers: req.headers,
    });
    throw new Error('User not authenticated');
  }
  const jwtToken = authHeader.split(' ')[1];

  const body = {
    query: query,
    k,
    entity_id: MENTOR_QUESTIONS_INDEX,
  };

  logger.debug('[searchQuestionsInRAG] Attempting to query RAG API', body);

  try {
    const response = await axios.post(`${process.env.RAG_API_URL}/query`, body, {
      headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
    });

    logger.debug('[searchQuestionsInRAG] RAG API response', {
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
    });

    return response.data;
  } catch (error) {
    logger.debug('[searchQuestionsInRAG] Error querying RAG API', {
      error: error.message,
      code: error.code,
      url,
      ragApiUrl: process.env.RAG_API_URL,
      stack: error.stack,
      response: error.response?.data,
    });
    throw new Error(`Failed to search questions: ${error.message}`);
  }
}

/**
 * Delete a question embedding from the RAG API by its file_id
 * @param {string} file_id The file_id to delete
 * @param {import('express').Request} req
 */
async function deleteQuestionFromRAG(file_id, req) {
  if (!process.env.RAG_API_URL) {
    throw new Error('RAG_API_URL not defined');
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.debug('[deleteQuestionFromRAG] Missing or invalid Authorization header', {
      headers: req.headers,
    });
    throw new Error('User not authenticated');
  }
  const jwtToken = authHeader.split(' ')[1];

  try {
    await axios.delete(`${process.env.RAG_API_URL}/documents`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      data: [file_id],
    });
    logger.debug('[deleteQuestionFromRAG] Successfully deleted question embedding', { file_id });
  } catch (error) {
    // Log but don't throw - we'll try to create the new embedding anyway
    logger.debug('[deleteQuestionFromRAG] Error deleting question embedding', {
      error: error.message,
      status: error.response?.status,
    });
  }
}

/**
 * @route POST /api/mentor-interest
 */
async function submitMentorInterest(req, res) {
  try {
    const data = mentorInterestSchema.parse(req.body);
    const mentorInterest = await MentorInterest.create(data);
    res.status(201).json(mentorInterest);
  } catch (err) {
    if (err.name === 'ZodError') {
      return handleError(res, { text: 'Invalid form data', errors: err.errors });
    }
    return handleError(res, { text: 'Error submitting mentor interest' });
  }
}

/**
 * @route GET /api/mentor-interest
 */
async function getMentorInterests(req, res) {
  try {
    const interests = await MentorInterest.find().sort({ createdAt: -1 });
    res.json(interests);
  } catch (err) {
    return handleError(res, { text: 'Error fetching mentor interests' });
  }
}

/**
 * @route GET /api/mentor-interest/questions
 */
async function getMentorQuestions(req, res) {
  try {
    const questions = await MentorQuestion.find().sort({ dateAdded: -1 });
    res.json(questions);
  } catch (err) {
    return handleError(res, { text: 'Error fetching mentor questions' });
  }
}

/**
 * @route POST /api/mentor-interest/questions
 */
async function addMentorQuestion(req, res) {
  try {
    const { question, pillar, subTags } = mentorQuestionSchema.parse(req.body);

    const newQuestion = await MentorQuestion.create({
      question,
      pillar,
      subTags,
      dateAdded: new Date(),
    });

    await storeQuestionInRAG(question, pillar, subTags, newQuestion._id.toString(), req);

    res.status(201).json(newQuestion);
  } catch (err) {
    return handleError(res, { text: 'Error adding mentor question' });
  }
}

/**
 * @route PUT /api/mentor-interest/questions/:id
 */
async function updateMentorQuestion(req, res) {
  try {
    const { id } = req.params;
    const { question, pillar, subTags } = mentorQuestionSchema.parse(req.body);
    const existing = await MentorQuestion.findById(id).lean();

    if (!existing) {
      return handleError(res, { text: 'Question not found' }, 404);
    }

    // First delete the existing embedding
    await deleteQuestionFromRAG(id, req);

    const updated = await MentorQuestion.findByIdAndUpdate(
      id,
      { question, pillar, subTags },
      { new: true },
    );

    await storeQuestionInRAG(question, pillar, subTags, id, req);

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'ZodError') {
      return handleError(res, { text: 'Invalid question data', errors: err.errors });
    }
    return handleError(res, { text: 'Error updating mentor question' });
  }
}

/**
 * @route POST /api/mentor-interest/search
 * Agent endpoint for searching mentor questions
 */
async function searchMentorQuestions(req, res) {
  try {
    const { query, k = 10 } = req.body;
    if (!query) {
      return handleError(res, { text: 'Query is required' }, 400);
    }

    const hits = await searchQuestionsInRAG(req, query, k);
    logger.debug('[searchMentorQuestions] Hits:', hits);
    if (!Array.isArray(hits) || hits.length === 0) {
      return res.json({ results: [] });
    }

    const fileIds = hits
      .map((h) => {
        let [jsonStr, sim] = Array.isArray(h) ? h : [h, null];
        let obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        if (Array.isArray(obj)) obj = obj[0];
        return obj.metadata?.file_id;
      })
      .filter(Boolean);

    // 3) fetch all matching questions in one go
    const docs = await MentorQuestion.find({ _id: { $in: fileIds } }).lean();

    // 4) build a lookup map for O(1) access
    const docMap = docs.reduce((map, d) => {
      map[d._id.toString()] = d;
      return map;
    }, {});

    // 5) reconstruct results in the same order as fileIds
    const results = fileIds
      .map((id) => {
        const doc = docMap[id];
        if (!doc) return null;
        return {
          question: doc.question,
          pillar: doc.pillar,
          subTags: doc.subTags || [],
        };
      })
      .filter(Boolean);

    res.json({ results });
  } catch (err) {
    logger.error('[searchMentorQuestions] Error:', err);
    return handleError(res, { text: 'Error searching mentor questions' });
  }
}

/**
 * @route POST /api/mentor-interest/:mentor_interest_id/response/:stage_id
 * @desc  Create **or** update a mentor response, using a monotonically‑
 *        increasing `version` field to guarantee "newest‑wins" semantics.
 *        If the incoming version is <= the stored version, the write is
 *        ignored and the canonical copy is returned unchanged.
 * @access Public (can be auth‑gated later)
 */
async function upsertMentorResponse(req, res) {
  try {
    const { mentor_interest_id, stage_id } = req.params;
    const { response_text = '', audio_url, version: incomingVersion } = req.body;

    const filter = { mentor_interest: mentor_interest_id, stage_id };
    const existing = await MentorResponse.findOne(filter);

    // --------------------------------------------------
    // No existing doc → create brand‑new
    // --------------------------------------------------
    if (!existing) {
      const newData = {
        ...filter,
        response_text,
        version: 1,
      };
      if (audio_url) newData.audio_url = audio_url;

      const created = await MentorResponse.create(newData);
      return res.status(201).json(created);
    }

    // --------------------------------------------------
    // Version checking for optimistic updates
    // --------------------------------------------------
    if (incomingVersion && incomingVersion <= existing.version) {
      // Incoming version is stale, return existing without updating
      return res.json(existing);
    }

    // --------------------------------------------------
    // Update only when incoming data is different
    // --------------------------------------------------
    let hasChanges = false;

    if (response_text !== existing.response_text) {
      existing.response_text = response_text;
      hasChanges = true;
    }

    if (audio_url && audio_url !== existing.audio_url) {
      existing.audio_url = audio_url;
      hasChanges = true;
    }

    if (hasChanges) {
      existing.version += 1;
      await existing.save();
    }

    return res.json(existing); // always send canonical (may be unchanged)
  } catch (err) {
    logger.error('[upsertMentorResponse] Error:', err);
    return handleError(res, { text: 'Error saving mentor response' });
  }
}

/**
 * @route GET /api/mentor-interest/:mentor_interest_id/response/:stage_id
 * @desc  Retrieve a single mentor response for this mentor & stage.
 *        Returns 404 if none exists.
 * @access Public (can be auth‑gated later)
 */
async function getMentorResponse(req, res) {
  try {
    const { mentor_interest_id, stage_id } = req.params;
    const response = await MentorResponse.findOne({
      mentor_interest: mentor_interest_id,
      stage_id,
    });
    if (!response) return res.status(404).end();
    res.json(response);
  } catch (err) {
    return handleError(res, { text: 'Error retrieving mentor response' });
  }
}

/**
 * @route GET /api/mentor-interest/questions/similar
 * @desc Get semantically similar questions based on input text for adaptive interviewing
 * @access Private (requires JWT)
 */
async function getSimilarQuestions(req, res) {
  try {
    const { text, k = 10 } = req.query;

    if (!text) {
      return handleError(res, { text: 'Query text is required' }, 400);
    }

    // Search RAG for similar questions
    const hits = await searchQuestionsInRAG(req, text, k);
    logger.debug('[getSimilarQuestions] RAG hits:', hits);

    if (!Array.isArray(hits) || hits.length === 0) {
      return res.json({ items: [] });
    }

    // Extract file_ids from RAG response
    const fileIds = hits
      .map((h) => {
        let [jsonStr, sim] = Array.isArray(h) ? h : [h, null];
        let obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        if (Array.isArray(obj)) obj = obj[0];
        return obj.metadata?.file_id;
      })
      .filter(Boolean);

    // Fetch matching questions from MongoDB
    const questions = await MentorQuestion.find({ _id: { $in: fileIds } }).lean();

    // Format response to match API contract
    const items = questions.map((q) => ({
      _id: q._id,
      question: q.question,
      pillar: q.pillar,
      subTags: q.subTags || [],
    }));

    res.json({ items });
  } catch (err) {
    logger.error('[getSimilarQuestions] Error:', err);
    return handleError(res, { text: 'Error retrieving similar questions' });
  }
}

/**
 * @route POST /api/mentor-interest/:mentor_interest_id/next-question
 * @desc Generate next adaptive question using AI based on previous answers and tags
 * @access Private (requires JWT)
 */
async function generateNextQuestion(req, res) {
  try {
    const { mentor_interest_id } = req.params;
    const { previous_stage_id, answer_text } = req.body;

    // Allow empty answer_text for skipping questions
    const effectiveAnswerText = answer_text || '[Question was skipped]';

    // For RAG search, use a generic query if no answer provided
    const searchQuery = answer_text || 'general mentor advice for young professionals';

    // Calculate next stage
    const nextStage = (previous_stage_id || 0) + 1;

    // Check if a question already exists for the next stage
    const existingResponse = await MentorResponse.findOne({
      mentor_interest: mentor_interest_id,
      stage_id: nextStage,
    });

    // If a question already exists for this stage, return it instead of generating a new one
    if (existingResponse && existingResponse.question) {
      logger.debug('[generateNextQuestion] Question already exists for stage', nextStage);
      return res.json({
        stage_id: nextStage,
        question: existingResponse.question,
        preamble: existingResponse.preamble || 'Continuing with your next question:',
        based_on_question_id: existingResponse.source_question_id,
      });
    }

    // Generate new question only if one doesn't exist
    logger.debug('[generateNextQuestion] Generating new question for stage', nextStage);

    // === GENERATE NEW QUESTION ===
    // The following code only runs when we need to create a new question

    // Get similar questions based on the answer
    const similarQuestions = await searchQuestionsInRAG(req, searchQuery, 20);

    if (!Array.isArray(similarQuestions) || similarQuestions.length === 0) {
      return handleError(res, { text: 'No similar questions found for context' }, 404);
    }

    // Get all previous questions and answers in this conversation
    const previousResponses = await MentorResponse.find({
      mentor_interest: mentor_interest_id,
      stage_id: { $lte: previous_stage_id }
    }).sort({ stage_id: 1 });

    // Get mentor's profile information
    const mentorProfile = await MentorInterest.findById(mentor_interest_id);
    if (!mentorProfile) {
      return handleError(res, { text: 'Mentor profile not found' }, 404);
    }

    // Build conversation history
    const conversationHistory = previousResponses.map(response => {
      return {
        stage: response.stage_id,
        question: response.question || (response.stage_id === 1 ? "Tell us about an exciting project or goal you're currently working on and a meaningful challenge you're navigating through." : "Unknown question"),
        answer: response.response_text || ''
      };
    });

    // Extract question IDs and fetch full question data
    const fileIds = similarQuestions
      .map((h) => {
        let [jsonStr, sim] = Array.isArray(h) ? h : [h, null];
        let obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        if (Array.isArray(obj)) obj = obj[0];
        return obj.metadata?.file_id;
      })
      .filter(Boolean);

    const contextQuestions = await MentorQuestion.find({ _id: { $in: fileIds } }).lean();

    // Create OpenAI client and generate question
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build context for AI
    const contextQuestionsText = contextQuestions
      .slice(0, 10) // Limit to top 10
      .map((q, i) => `${i + 1}. [ID: ${q._id}] ${q.question}`)
      .join('\n');

    const payload = [
      {
        role: 'system',
        content: `
You are MELD's mentor interviewer AI. Your job is to choose or generate follow-up questions that extract actionable or emotionally resonant advice for young women (ages 20-25) based on mentors' responses.

Your goal is to sound like a smart, empathetic older sister—someone who’s strategic, curious, and grounded, but also real about what it’s like to be starting out.

---
Focus Areas (aligned with MELD’s 4 Pillars):
1. Starting Points to Success – early-career mindset, career discovery, rejection, growth, mentorship, resilience, leadership, community
2. Profile & Presentation – interviews, first impressions, storytelling, personal brand, professional presence, visibility, online identity
3. Financial Fluency – salary negotiation, compensation strategy, early money habits, investing, equity, financial boundaries, talking about money
4. The Future of Work – hybrid work, remote teams, intergenerational dynamics, adapting to tech change, inclusion, AI/automation, flexibility & retention

---
How to Ask Questions:
- Use the mentor’s specific background (title, industry, experience) to craft deeply relevant and non-generic questions
- Aim for either actionable steps or emotional clarity—depending on what the mentor’s response calls for
- Ask questions that a 22-year-old woman would actually ask or text her best friend about after a long day at work

Follow-Up Behavior:
- If the mentor's answer feels surface-level, vague, or general, ask a follow-up that digs deeper into *how* they did it, *what it looked like in action*, or *what advice they’d give their younger self*
- If the mentor already gave a specific, in-depth answer, move to a new topic to keep the conversation fresh
- You are not just filling space—you are building understanding

Tactics:
- If the last answer was tactical, go emotional
- If the last answer was emotional, go tactical
- If the last few questions were serious, it’s okay to pivot into something lighter, more personal, or unexpected

---
Formatting Instructions:
Always respond in JSON with the following format:
\`\`\`json
{
  "question": "Your question here",
  "preamble": "A 1-2 sentence statement that connects the mentor's last response to your next question.",
  "based_on_id": "existing_question_id_if_applicable_or_null"
}
\`\`\`

---
What NOT to Do:
- Don’t repeat question styles or themes already asked in the session
- Don’t ask something the mentor already answered
- Don’t ask vague questions like "What skills are important?"—be more specific, grounded, and situational
- Don’t assume the user has leadership power—ask from the POV of someone just starting out
- Don’t force a follow-up if the mentor already went deep—trust the pacing of the conversation

---
Great Example Questions:
- "What’s one thing a new hire could say in a meeting to show they’re paying attention, without trying to sound overly polished?"
- "How do you make real friends at work without it feeling fake or forced?"
- "If someone keeps interrupting you in meetings, what’s a respectful but firm way to push back?"
- "What’s something you thought mattered at 22 that turned out not to matter at all?"
- "If I’m exhausted but still want to grow, what’s one boundary I have to protect?"

---
Tone: curious, confident, emotionally intelligent, honest, and helpful. You are here to get real answers for real young women trying to figure it out.
`,
      },
      {
        role: 'user',
        content: `MENTOR PROFILE:
Name: ${mentorProfile.firstName} ${mentorProfile.lastName || ''}
Job Title: ${mentorProfile.jobTitle}
Company: ${mentorProfile.company || 'Not specified'}
Industry: ${mentorProfile.industry}
Career Stage: ${mentorProfile.careerStage}
Email: ${mentorProfile.email}`,
      },
      {
        role: 'user',
        content: `CONVERSATION HISTORY:
${conversationHistory.map(entry => `Q${entry.stage}: ${entry.question}
A${entry.stage}: ${entry.answer}`).join('\n\n')}`,
      },
      {
        role: 'user',
        content: `Current mentor answer: "${effectiveAnswerText}"`,
      },
      {
        role: 'assistant',
        content: `Here are ${contextQuestions.length} similar questions for context:\n${contextQuestionsText}`,
      },
      {
        role: 'user',
        content:
          "Based on the mentor's profile, full conversation history, and latest answer, generate a thoughtful follow-up question that explores a NEW topic/area with actionable advice specific to their industry/role. Avoid repeating themes from previous questions.",
      },
    ];

    // Use direct OpenAI API call to ensure no streaming
    logger.debug('[generateNextQuestion] Making OpenAI API call with parameters:', {
      model: 'gpt-4o-mini',
      stream: false,
      temperature: 0.7,
      max_tokens: 200,
      messagesCount: payload.length
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: payload,
      temperature: 0.7,
      max_tokens: 200,
      stream: false, // Explicitly disable streaming
    });

    logger.debug('[generateNextQuestion] OpenAI API response type:', {
      isStream: completion instanceof ReadableStream,
      hasChoices: !!completion.choices,
      choicesLength: completion.choices?.length,
      firstChoiceContent: completion.choices?.[0]?.message?.content?.substring(0, 100)
    });

    // Extract the response content
    const completionText = completion.choices[0]?.message?.content || '';

    logger.debug('[generateNextQuestion] Raw completion:', completionText);

    let aiResponse;
    try {
      aiResponse = JSON.parse(completionText.trim());
    } catch (parseError) {
      logger.warn('[generateNextQuestion] JSON parse failed, trying fallback:', parseError);
      // More aggressive fallback parsing
      const jsonMatch = completionText.match(/\{[^}]*"question"[^}]*\}/);
      if (jsonMatch) {
        try {
          aiResponse = JSON.parse(jsonMatch[0]);
        } catch (fallbackError) {
          logger.error('[generateNextQuestion] Fallback parse also failed:', fallbackError);
          // Final fallback - extract question text manually
          const questionMatch = completionText.match(/"question":\s*"([^"]+)"/);
          aiResponse = {
            question: questionMatch ? questionMatch[1] : 'What specific challenge would you like to discuss next?',
            preamble: 'Thank you for sharing your insights.',
            based_on_id: null,
          };
        }
      } else {
        // Ultimate fallback
        aiResponse = {
          question: 'What specific challenge would you like to discuss next?',
          preamble: 'Thank you for sharing your insights.',
          based_on_id: null,
        };
      }
    }

    // Ensure aiResponse has a preamble field (in case AI didn't include it)
    if (!aiResponse.preamble) {
      aiResponse.preamble = 'Thank you for sharing your insights. Here\'s your next question:';
    }

    // Save the generated question as a new response entry (or update if exists)
    await MentorResponse.findOneAndUpdate(
      {
        mentor_interest: mentor_interest_id,
        stage_id: nextStage,
      },
      {
        question: aiResponse.question,
        preamble: aiResponse.preamble,
        source_question_id: aiResponse.based_on_id === "null" || aiResponse.based_on_id === null ? null : aiResponse.based_on_id,
        response_text: '', // Will be filled when mentor answers
        version: 1, // Reset version for new question
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
      },
    );

    const finalResponse = {
      stage_id: nextStage,
      question: aiResponse.question,
      preamble: aiResponse.preamble,
      based_on_question_id: aiResponse.based_on_id,
    };

    logger.debug('[generateNextQuestion] Sending final response:', finalResponse);

    res.json(finalResponse);
  } catch (err) {
    logger.error('[generateNextQuestion] Error:', err);
    return handleError(res, { text: 'Error generating next question' });
  }
}

/**
 * @route GET /api/mentor-interest/:id
 */
async function getMentorInterest(req, res) {
  try {
    const { id } = req.params;
    const interest = await MentorInterest.findById(id);
    if (!interest) {
      return handleError(res, { text: 'Mentor interest not found' }, 404);
    }
    res.json(interest);
  } catch (err) {
    return handleError(res, { text: 'Error fetching mentor interest' });
  }
}

/**
 * @route POST /api/mentor-interest/:id/generate-intro
 * @desc Generate grammatically correct personalized introduction using AI
 * @access Public
 */
async function generatePersonalizedIntro(req, res) {
  try {
    const { id } = req.params;

    // Get mentor profile
    const mentorProfile = await MentorInterest.findById(id);
    if (!mentorProfile) {
      return handleError(res, { text: 'Mentor profile not found' }, 404);
    }

    if (!mentorProfile.jobTitle || !mentorProfile.company) {
      return handleError(res, { text: 'Job title and company are required for intro generation' }, 400);
    }

    // Create OpenAI client
    const OpenAI = require('openai');
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const payload = [
      {
        role: 'system',
        content: `You are a professional copywriter specializing in grammatically correct business introductions. Your task is to create a single, grammatically perfect sentence for mentor introductions.`,
      },
      {
        role: 'user',
        content: `Create a grammatically correct opening sentence for a mentor introduction. The mentor's job title is "${mentorProfile.jobTitle}" and they work at "${mentorProfile.company}".

The sentence should follow this pattern but with proper grammar:
"As [article] [job title] at [proper company name with correct articles], your experience offers critical insights for women in their 20s navigating the early stages of their professional journey."

Grammar rules:
- Use "a" or "an" for common job titles (e.g., "As a Marketing Manager")
- Use "the" for unique positions (e.g., "As the CEO", "As the First Lady", "As the President")
- Add "the" before company names when appropriate (e.g., "the White House", "the United Nations", "the New York Times")
- Keep the ending exactly as: "your experience offers critical insights for women in their 20s navigating the early stages of their professional journey."

Return ONLY the complete sentence, no extra punctuation, nothing else.`,
      },
    ];

    // Generate the introduction
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: payload,
      temperature: 0.3,
      max_tokens: 150,
      stream: false,
    });

    // Extract the response content
    const completionText = completion.choices[0]?.message?.content || '';

    logger.debug('[generatePersonalizedIntro] Generated intro:', completionText);

    res.json({
      introduction: completionText,
      jobTitle: mentorProfile.jobTitle,
      company: mentorProfile.company,
    });

  } catch (err) {
    logger.error('[generatePersonalizedIntro] Error:', err);
    return handleError(res, { text: 'Error generating personalized introduction' });
  }
}

module.exports = {
  storeQuestionInRAG,
  submitMentorInterest,
  getMentorInterests,
  getMentorQuestions,
  addMentorQuestion,
  updateMentorQuestion,
  searchMentorQuestions,
  upsertMentorResponse,
  getMentorResponse,
  generateNextQuestion,
  getMentorInterest,
  generatePersonalizedIntro,
  getSimilarQuestions,
};
