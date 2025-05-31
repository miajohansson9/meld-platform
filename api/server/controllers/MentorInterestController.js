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
    const { previous_stage_id, answer_text, selected_tags } = req.body;

    if (
      !answer_text ||
      !selected_tags ||
      !Array.isArray(selected_tags) ||
      selected_tags.length !== 3
    ) {
      return handleError(
        res,
        { text: 'answer_text and exactly 3 selected_tags are required' },
        400,
      );
    }

    // Get similar questions based on the answer
    const similarQuestions = await searchQuestionsInRAG(req, answer_text, 20);

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
        answer: response.response_text || '',
        selectedTags: response.selected_tags || []
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
    const OpenAIClient = require('~/app/clients/OpenAIClient');
    const client = new OpenAIClient(process.env.OPENAI_API_KEY, {
      endpoint: 'openAI',
      modelOptions: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 200,
        stream: false, // Explicitly disable streaming
      },
    });

    // Build context for AI
    const contextQuestionsText = contextQuestions
      .slice(0, 10) // Limit to top 10
      .map((q, i) => `${i + 1}. [ID: ${q._id}] ${q.question}`)
      .join('\n');

    const payload = [
      {
        role: 'system',
        content: `You are MELD's mentor interviewer AI. Your job is to choose or generate follow-up questions that extract actionable advice for young women (ages 20-25) from mentors based on their previous responses.

          Focus Areas: money/finances, relationships, career advancement, professional presentation, interviewing, networking, confidence-building, work-life balance

          CRITICAL: Review the full conversation history to avoid asking similar questions or covering the same topics. Each question should explore a DIFFERENT area or angle.

          Guidelines:
          - Use the mentor's specific background (job title, industry, experience level) to craft highly relevant questions
          - Create questions that bridge the mentor's specific experience with practical needs of young women starting their careers
          - Ask for concrete, actionable advice that someone could implement immediately (e.g., "What's one thing a 25-year-old could do tomorrow to...")
          - Focus on insider knowledge, tactics, and strategies that aren't commonly shared elsewhere
          - Use leading techniques: "Given your experience as a [mentor's job title] in [mentor's industry], what's one [specific action/strategy/tip] you wish you'd known when..."
          - Frame questions to extract step-by-step advice, scripts, frameworks, or specific behaviors
          - Target unique insights from their industry/role that young women can apply (e.g., salary negotiation tactics, networking approaches, presentation tips)
          - AVOID repeating themes, topics, or question styles from previous questions in this conversation
          - If previous questions covered credibility/first impressions, explore different areas like finances, relationships, specific skills, etc.
          - Keep questions concise but impactful (under 200 characters)
          - You can either choose one of the similar questions provided (use its ID for based_on_id), or craft a completely new question (use null for based_on_id)
          - If you choose an existing question, reframe it to be more actionable and specific to young women's needs
          - Generate a brief preamble (1-2 sentences) that ties their previous response to your next question
          - Respond with JSON: {"question": "your question here", "preamble": "1-2 sentences connecting their response to your question", "based_on_id": "question_id_if_using_existing_or_null"}`,
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
A${entry.stage}: ${entry.answer}
Tags: ${entry.selectedTags.join(', ')}`).join('\n\n')}`,
      },
      {
        role: 'user',
        content: `Current mentor answer: "${answer_text}"`,
      },
      {
        role: 'user',
        content: `Key themes the mentor selected: ${selected_tags.join(', ')}`,
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

    // Add explicit non-streaming options
    const completion = await client.sendCompletion(payload, {
      // Ensure no streaming
      onProgress: undefined,
      abortController: new AbortController(),
    });

    // Clean up any potential streaming artifacts
    let cleanCompletion = completion;
    if (typeof completion !== 'string') {
      logger.error('[generateNextQuestion] Unexpected completion type:', typeof completion);
      cleanCompletion = String(completion);
    }

    // Remove any SSE prefixes or artifacts
    cleanCompletion = cleanCompletion
      .replace(/^data:\s*/gm, '') // Remove SSE data: prefixes
      .replace(/^event:\s*\w+/gm, '') // Remove SSE event: lines
      .replace(/\n\n/g, '\n') // Clean up double newlines
      .trim();

    logger.debug('[generateNextQuestion] Raw completion:', completion);
    logger.debug('[generateNextQuestion] Clean completion:', cleanCompletion);

    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanCompletion);
    } catch (parseError) {
      logger.warn('[generateNextQuestion] JSON parse failed, trying fallback:', parseError);
      // More aggressive fallback parsing
      const jsonMatch = cleanCompletion.match(/\{[^}]*"question"[^}]*\}/);
      if (jsonMatch) {
        try {
          aiResponse = JSON.parse(jsonMatch[0]);
        } catch (fallbackError) {
          logger.error('[generateNextQuestion] Fallback parse also failed:', fallbackError);
          // Final fallback - extract question text manually
          const questionMatch = cleanCompletion.match(/"question":\s*"([^"]+)"/);
          aiResponse = {
            question: questionMatch ? questionMatch[1] : `What aspect of ${selected_tags[0]} would you like to explore further?`,
            preamble: `I'd love to hear more about your experience with ${selected_tags[0]}.`,
            based_on_id: null,
          };
        }
      } else {
        // Ultimate fallback
        aiResponse = {
          question: `Based on your interest in ${selected_tags.join(', ')}, what specific challenge would you like to discuss?`,
          preamble: `Your insights about ${selected_tags[0]} are really valuable.`,
          based_on_id: null,
        };
      }
    }

    // Ensure aiResponse has a preamble field (in case AI didn't include it)
    if (!aiResponse.preamble) {
      aiResponse.preamble = `Thank you for sharing that. Building on what you said about ${selected_tags[0]}...`;
    }

    // Calculate next stage
    const nextStage = (previous_stage_id || 0) + 1;

    // Save the generated question as a new response entry (or update if exists)
    await MentorResponse.findOneAndUpdate(
      {
        mentor_interest: mentor_interest_id,
        stage_id: nextStage,
      },
      {
        question: aiResponse.question,
        preamble: aiResponse.preamble,
        source_question_id: aiResponse.based_on_id,
        response_text: '', // Will be filled when mentor answers
        version: 1, // Reset version for new question
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
      },
    );

    res.json({
      stage_id: nextStage,
      question: aiResponse.question,
      preamble: aiResponse.preamble,
      based_on_question_id: aiResponse.based_on_id,
    });
  } catch (err) {
    logger.error('[generateNextQuestion] Error:', err);
    return handleError(res, { text: 'Error generating next question' });
  }
}

/**
 * @route POST /api/mentor-interest/:mentor_interest_id/response/:stage_id/tags
 * @desc Save selected tags for a mentor response (exactly 3 tags required)
 * @access Private (requires JWT)
 */
async function saveMentorResponseTags(req, res) {
  try {
    const { mentor_interest_id, stage_id } = req.params;
    const { selected_tags } = req.body;

    if (!selected_tags || !Array.isArray(selected_tags) || selected_tags.length !== 3) {
      return handleError(res, { text: 'Exactly 3 selected_tags are required' }, 400);
    }

    // Find and update the response
    const response = await MentorResponse.findOneAndUpdate(
      {
        mentor_interest: mentor_interest_id,
        stage_id: parseInt(stage_id),
      },
      {
        selected_tags,
        $inc: { version: 1 }, // Increment version for optimistic updates
      },
      {
        new: true,
        upsert: false, // Don't create if doesn't exist
      },
    );

    if (!response) {
      return handleError(res, { text: 'Mentor response not found' }, 404);
    }

    res.json(response);
  } catch (err) {
    logger.error('[saveMentorResponseTags] Error:', err);
    return handleError(res, { text: 'Error saving mentor response tags' });
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
  getSimilarQuestions,
  generateNextQuestion,
  saveMentorResponseTags,
  getMentorInterest,
};
