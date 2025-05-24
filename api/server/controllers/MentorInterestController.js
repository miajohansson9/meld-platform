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
    const { response_text = '' } = req.body;

    const filter = { mentor_interest: mentor_interest_id, stage_id };
    const existing = await MentorResponse.findOne(filter);

    // --------------------------------------------------
    // No existing doc → create brand‑new
    // --------------------------------------------------
    if (!existing) {
      const created = await MentorResponse.create({ ...filter, response_text });
      return res.status(201).json(created);
    }

    // --------------------------------------------------
    // Update only when incoming response_text is different
    // --------------------------------------------------
    if (response_text !== existing.response_text) {
      existing.response_text = response_text;
      await existing.save();
    }

    return res.json(existing); // always send canonical (may be unchanged)
  } catch (err) {
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
};
