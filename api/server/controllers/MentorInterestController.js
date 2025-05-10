// src/controllers/MentorInterestController.js

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { logger } = require('~/config');
const MentorQuestion = require('../../models/MentorQuestion');
const MentorInterest = require('../../models/MentorInterest');
const { mentorQuestionSchema, mentorInterestSchema } = require('~/validation/mentorInterest');
const { handleError } = require('../utils');
const FormData = require('form-data');

/**
 * Store (or re-store) a question embedding in the RAG API by uploading it
 * as a “file” in multipart/form-data.  This matches the way LibreChat’s
 * uploadVectors tool works.
 *
 * @param {string} question   The question text
 * @param {string} file_id    The UUID to identify this embedding
 * @param {import('express').Request} req
 */
async function storeQuestionInRAG(question, file_id, req) {
  if (!process.env.RAG_API_URL) {
    throw new Error('RAG_API_URL not defined');
  }
  if (!file_id) {
    throw new Error('Internal error: missing file_id');
  }

  // 1) extract the JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.debug('[storeQuestionInRAG] Missing or invalid Authorization header', {
      headers: req.headers,
    });
    throw new Error('User not authenticated');
  }
  const jwtToken = authHeader.split(' ')[1];

  // 2) build form-data exactly like uploadVectors does
  const formData = new FormData();
  formData.append('file_id', file_id);
  formData.append('file', Buffer.from(question, 'utf-8'), {
    filename: `question_${file_id}.txt`,
    contentType: 'text/plain',
  });
  // optional additional metadata
  formData.append('model', 'text-embedding-3-small');

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
  });
}

/**
 * Search embeddings in RAG API.
 * @param {string} query
 * @param {number} k
 * @returns {Promise<Array<{ file_id: string; similarity: number }>>}
 */
async function searchQuestionsInRAG(query, k = 10) {
  if (!process.env.RAG_API_URL) {
    throw new Error('RAG_API_URL not defined');
  }
  const response = await axios.post(
    `${process.env.RAG_API_URL}/query`,
    { text: query, k },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
  );
  return response.data.results;
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
    const file_id = uuidv4();

    await storeQuestionInRAG(question, file_id, req);

    const newQuestion = await MentorQuestion.create({
      question,
      pillar,
      subTags,
      dateAdded: new Date(),
      file_id,
    });
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

    // If there's no file_id yet, generate one now
    const file_id = existing.file_id || uuidv4();

    // Embed the updated text (or initial text if file_id was missing)
    await storeQuestionInRAG(question, file_id, req);

    const updated = await MentorQuestion.findByIdAndUpdate(
      id,
      { question, pillar, subTags, file_id },
      { new: true },
    );

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'ZodError') {
      return handleError(res, { text: 'Invalid question data', errors: err.errors });
    }
    return handleError(res, { text: 'Error updating mentor question' });
  }
}

module.exports = {
  storeQuestionInRAG,
  submitMentorInterest,
  getMentorInterests,
  getMentorQuestions,
  addMentorQuestion,
  updateMentorQuestion,
};
