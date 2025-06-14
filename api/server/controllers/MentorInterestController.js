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
const { OpenAI } = require('openai');

/**
 * Store (or re-store) a question embedding in the RAG API by uploading it
 * as a "file" in multipart/form-data. This matches the way LibreChat's
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
    throw new Error('Failed to store question in RAG API');
  }
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
    throw new Error('User not authenticated');
  }
  const jwtToken = authHeader.split(' ')[1];

  const body = {
    query: query,
    k,
    entity_id: MENTOR_QUESTIONS_INDEX,
  };

  try {
    const response = await axios.post(`${process.env.RAG_API_URL}/query`, body, {
      headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
    });

    return response.data;
  } catch (error) {
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
  } catch (error) {
    // Log but don't throw - we'll try to create the new embedding anyway
  }
}

/**
 * Middleware to validate access token and find mentor interest
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
async function validateAccessToken(req, res, next) {
  try {
    const { access_token } = req.params;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Find mentor interest by access token
    const mentorInterest = await MentorInterest.findOne({
      accessToken: access_token
    }).select('+accessToken');

    if (!mentorInterest) {
      return res.status(404).json({ error: 'Invalid access token' });
    }

    // Block access if interview was submitted
    if (mentorInterest.status === 'submitted') {
      return res.status(403).json({ 
        error: 'Interview has been completed. If you need to update your answers, please contact support.' 
      });
    }

    // Block access if interview was rejected
    if (mentorInterest.status === 'rejected') {
      return res.status(403).json({ 
        error: 'Interview application was not approved. Please contact support if you believe this is an error.' 
      });
    }

    // Attach mentor interest to request (without token fields)
    req.mentorInterest = {
      _id: mentorInterest._id,
      firstName: mentorInterest.firstName,
      lastName: mentorInterest.lastName,
      email: mentorInterest.email,
      jobTitle: mentorInterest.jobTitle,
      company: mentorInterest.company,
      industry: mentorInterest.industry,
      careerStage: mentorInterest.careerStage,
      status: mentorInterest.status,
      createdAt: mentorInterest.createdAt,
      updatedAt: mentorInterest.updatedAt
    };
    
    next();
  } catch (error) {
    console.error('Error validating access token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * @route POST /api/mentor-interest
 */
async function submitMentorInterest(req, res) {
  try {
    const data = mentorInterestSchema.parse(req.body);
    const mentorInterest = await MentorInterest.create(data);

    // Get the created record with access token (for returning to user)
    const mentorInterestWithToken = await MentorInterest.findById(mentorInterest._id)
      .select('+accessToken');

    // Return the access token only on creation
    res.status(201).json({
      _id: mentorInterestWithToken._id,
      firstName: mentorInterestWithToken.firstName,
      lastName: mentorInterestWithToken.lastName,
      email: mentorInterestWithToken.email,
      jobTitle: mentorInterestWithToken.jobTitle,
      company: mentorInterestWithToken.company,
      industry: mentorInterestWithToken.industry,
      careerStage: mentorInterestWithToken.careerStage,
      status: mentorInterestWithToken.status,
      accessToken: mentorInterestWithToken.accessToken, // Only returned here
      createdAt: mentorInterestWithToken.createdAt,
      updatedAt: mentorInterestWithToken.updatedAt
    });
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
    // Use aggregation to include accessToken only if it exists in the document
    const interests = await MentorInterest.aggregate([
      {
        $addFields: {
          // Only include accessToken if the field exists in the document
          accessToken: {
            $cond: {
              if: { $ifNull: ["$accessToken", false] },
              then: "$accessToken",
              else: null
            }
          }
        }
      },
      {
        $project: {
          // Exclude updatedAt field
          updatedAt: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

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
 * @route POST /api/mentor-interview/:access_token/response/:stage_id
 */
async function upsertMentorResponse(req, res) {
  try {
    const { stage_id } = req.params;
    const mentor_interest_id = req.mentorInterest._id;
    const fs = require('fs').promises;

    // Handle multipart form data with audio blob (NEW SYNCHRONOUS FLOW)
    if (req.file) {
      try {
        logger.debug('[upsertMentorResponse] Processing audio upload for immediate transcription:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          stageId: stage_id
        });

        // Read audio buffer from uploaded file
        const audioBuffer = await fs.readFile(req.file.path);

        // Create audio file metadata for STTService
        const audioFile = {
          originalname: req.file.originalname || 'recording.webm',
          mimetype: req.file.mimetype || 'audio/webm',
          size: req.file.size || audioBuffer.length
        };

        // Use OpenAI Whisper API directly for immediate transcription
        const FormData = require('form-data');
        const axios = require('axios');

        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not configured');
        }

        logger.debug('[upsertMentorResponse] Starting transcription with OpenAI Whisper');

        // Create form data for OpenAI API
        const formData = new FormData();
        formData.append('file', audioBuffer, {
          filename: audioFile.originalname,
          contentType: audioFile.mimetype,
        });
        formData.append('model', 'whisper-1');

        // Call OpenAI Whisper API directly
        const transcriptionResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders(),
          },
          timeout: 60000 // 60 second timeout
        });

        const transcribedText = transcriptionResponse.data.text?.trim();

        if (!transcribedText) {
          throw new Error('No transcription text returned from OpenAI API');
        }

        logger.info('[upsertMentorResponse] Transcription completed:', {
          stageId: stage_id,
          textLength: transcribedText.length,
          model: 'whisper-1'
        });

        // Extract duration from request body
        const duration_ms = parseInt(req.body.duration_ms) || 0;

        // Save transcribed response to database
        const mentorResponse = await MentorResponse.findOneAndUpdate(
          { mentor_interest: mentor_interest_id, stage_id: parseInt(stage_id) },
          {
            response_text: transcribedText,
            duration_ms,
            status: 'transcribed',
            whisper_model: 'whisper-1',
            version: 1
          },
          { upsert: true, new: true }
        );

        // Update MentorInterest status from "pending" to "interview started" when they answer any question
        await MentorInterest.findOneAndUpdate(
          { _id: mentor_interest_id, status: 'pending' },
          { status: 'interview started' },
          { new: true }
        );

        // Clean up temporary file
        try {
          await fs.unlink(req.file.path);
          logger.debug('[upsertMentorResponse] Temporary audio file cleaned up');
        } catch (unlinkError) {
          logger.warn('[upsertMentorResponse] Failed to clean up temporary file:', unlinkError);
        }

        return res.json({
          success: true,
          response_text: transcribedText,
          duration_ms: mentorResponse.duration_ms,
          stage_id: mentorResponse.stage_id,
          status: mentorResponse.status
        });

      } catch (transcriptionError) {
        logger.error('[upsertMentorResponse] Transcription failed:', transcriptionError);

        // Clean up temporary file on error
        if (req.file && req.file.path) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            logger.warn('[upsertMentorResponse] Failed to clean up temp file after error:', unlinkError);
          }
        }

        return res.status(500).json({
          success: false,
          error: 'Transcription failed: ' + transcriptionError.message
        });
      }
    }

    // Handle text-only updates (EXISTING FLOW - simplified)
    else {
      const { response_text = '', status = 'transcribed', version: incomingVersion, rejection_reason } = req.body;

      const filter = { mentor_interest: mentor_interest_id, stage_id: parseInt(stage_id) };

      // Handle rejection status separately
      if (status === 'rejected') {
        const { question, preamble } = req.body;
        const rejectedResponse = await MentorResponse.create({
          mentor_interest: mentor_interest_id,
          stage_id: parseInt(stage_id),
          response_text: response_text,
          question: question || 'Question not available',
          preamble: preamble || 'Preamble not available',
          status: 'rejected',
          rejection_reason: rejection_reason || 'Question mismatch',
          version: 1
        });

        return res.json(rejectedResponse);
      }

      // For regular responses, check if active response exists (exclude rejected)
      const existing = await MentorResponse.findOne({
        ...filter,
        status: { $ne: 'rejected' }
      });

      if (!existing) {
        const created = await MentorResponse.create({
          ...filter,
          response_text,
          status,
          version: 1
        });

        // Update MentorInterest status from "approved" to "interview started" when they answer any question
        await MentorInterest.findOneAndUpdate(
          { _id: mentor_interest_id, status: 'approved' },
          { status: 'interview started' },
          { new: true }
        );

        return res.status(201).json(created);
      }

      if (incomingVersion && incomingVersion <= existing.version) {
        return res.json(existing);
      }

      if (response_text === existing.response_text && status === existing.status) {
        return res.json(existing);
      }

      const updated = await MentorResponse.findOneAndUpdate(
        { ...filter, status: { $ne: 'rejected' } },
        {
          response_text,
          status,
          version: existing.version + 1
        },
        { new: true }
      );

      // Update MentorInterest status from "pending" to "interview started" when they answer any question
      await MentorInterest.findOneAndUpdate(
        { _id: mentor_interest_id, status: 'pending' },
        { status: 'interview started' },
        { new: true }
      );

      return res.json(updated);
    }

  } catch (err) {
    logger.error('[upsertMentorResponse] Error:', err);
    return handleError(res, { text: 'Error saving mentor response: ' + err.message });
  }
}

/**
 * @route GET /api/mentor-interview/:access_token/response/:stage_id
 */
async function getMentorResponse(req, res) {
  try {
    const { stage_id } = req.params;
    const mentor_interest_id = req.mentorInterest._id;

    const response = await MentorResponse.findOne({
      mentor_interest: mentor_interest_id,
      stage_id,
      status: { $ne: 'rejected' } // Exclude rejected responses by default
    });

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json(response);
  } catch (err) {
    return handleError(res, { text: 'Error fetching mentor response' });
  }
}

/**
 * @route POST /api/mentor-interview/:access_token/generate-question
 * @desc Generate next adaptive question using AI based on previous answers and tags
 * @access Public (token validated)
 */
async function generateNextQuestion(req, res) {
  try {
    const mentor_interest_id = req.mentorInterest._id;
    const { previous_stage_id, answer_text, force_regenerate } = req.body;
    const effectiveAnswerText = answer_text || '[Question was skipped]';

    // Calculate next stage`
    const nextStage = (previous_stage_id || 0) + 1;

    // Check if a question already exists for the next stage
    const existingResponse = await MentorResponse.findOne({
      mentor_interest: mentor_interest_id,
      stage_id: nextStage,
      status: { $ne: 'rejected' } // Only consider non-rejected responses
    });

    // If a question already exists for this stage and we're not forcing regeneration, return it
    if (existingResponse && existingResponse.question && !force_regenerate) {
      return res.json({
        stage_id: nextStage,
        question: existingResponse.question,
        preamble: existingResponse.preamble || 'Continuing with your next question:',
      });
    }

    // Generate new question only if one doesn't exist

    // === GENERATE NEW QUESTION ===
    // The following code only runs when we need to create a new question
    // Get all previous questions and answers in this conversation (exclude rejected)
    const previousResponses = await MentorResponse.find({
      mentor_interest: mentor_interest_id,
      stage_id: { $lte: previous_stage_id },
      status: { $ne: 'rejected' }
    }).sort({ stage_id: 1 });

    // Get rejected questions for the current stage to avoid similar questions
    const rejectedQuestions = await MentorResponse.find({
      mentor_interest: mentor_interest_id,
      stage_id: nextStage,
      status: 'rejected'
    }).sort({ createdAt: 1 });

    // Get mentor's profile information
    const mentorProfile = req.mentorInterest;

    // Build conversation history
    const conversationHistory = previousResponses.map(response => {
      return {
        stage: response.stage_id,
        question: response.question || (response.stage_id === 1 ? "Tell us about an exciting project or goal you're currently working on and a meaningful challenge you're navigating through." : "Unknown question"),
        answer: response.response_text || ''
      };
    });

    // Create OpenAI client and generate question
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const payload = [
      {
        role: 'system',
        content: `
You are MELD's mentor interviewer AI. Your job is to choose or generate follow-up questions that extract actionable or emotionally resonant advice for young women (ages 20-25) based on mentors' responses.

Your goal is to sound like a smart, empathetic older sister—someone who's strategic, curious, and grounded, but also real about what it's like to be starting out.

---
Focus Areas (aligned with MELD's 4 Pillars):
1. Starting Points to Success – early-career mindset, career discovery, rejection, growth, mentorship, resilience, leadership, community, shared experiences in upbringing
2. Profile & Presentation – interviews, first impressions, storytelling, personal brand, professional presence, visibility, online identity, attire, feeling ready inside and out
3. Financial Fluency – salary negotiation, compensation strategy, early money habits, investing, equity, financial boundaries, talking about money
4. The Future of Work – hybrid work, remote teams, intergenerational dynamics, adapting to tech change, inclusion, AI/automation, flexibility & retention, trends

---
How to Ask Questions:
- Use the mentor's specific background (title, industry, experience) to craft deeply relevant and non-generic questions
- Aim for either actionable steps or emotional clarity—depending on what the mentor's response calls for
- Ask questions that a 22-year-old woman would actually ask or text her best friend about after a long day at work
- Encourage specific stories and examples by asking about particular moments, situations, or experiences
- Frame questions to elicit "Tell me about a time when..." or "What did that look like for you?" responses

Follow-Up Behavior:
- If the mentor's answer feels surface-level, vague, or general, ask a follow-up that digs deeper into *how* they did it, *what it looked like in action*, or *what advice they'd give their younger self*
- If the mentor already gave a specific, in-depth answer, move to a new topic to keep the conversation fresh
- You are not just filling space—you are building understanding

Tactics:
- If the last answer was tactical, go emotional
- If the last answer was emotional, go tactical
- If the last few questions were serious, it's okay to pivot into something lighter, more personal, or unexpected

---
Formatting Instructions:
IMPORTANT: Return ONLY plain JSON. Do not use markdown code blocks or any formatting. 
Your response must be valid JSON that can be parsed directly:

{
  "question": "Your question here",
  "preamble": "A 1-2 sentence statement that connects the mentor's last response to your next question."
}

Do not wrap the JSON in \`\`\`json \`\`\` or any other formatting. Return the raw JSON object ONLY. NOTHING ELSE.

---
What NOT to Do:
- Don't repeat question styles or themes already asked in the session
- Don't ask something the mentor already answered
- Don't ask vague questions like "What skills are important?"—be more specific, grounded, and situational
- Don't assume the user has leadership power—ask from the POV of someone just starting out
- Don't force a follow-up if the mentor already went deep—trust the pacing of the conversation

---
Great Example Questions:
- "What's one thing a new hire could say in a meeting to show they're paying attention, without trying to sound overly polished?"
- "How do you make real friends at work without it feeling fake or forced?"
- "If someone keeps interrupting you in meetings, what's a respectful but firm way to push back?"
- "What's something you thought mattered at 22 that turned out not to matter at all?"
- "If I'm exhausted but still want to grow, what's one boundary I have to protect?"
- "Tell me about a time when you had to advocate for yourself at work—what did that conversation actually sound like?"
- "Can you walk me through a specific moment when you felt completely out of your depth? How did you handle it?"
- "What's a mistake you made early in your career that you're actually grateful for now? What happened?"
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
    ];

    // Add rejected questions context if any exist
    payload.push({
      role: 'user',
      content: `The mentor rejected answering the questions below:
    
    ${rejectedQuestions.map(q => `• ${q.question || 'Question text missing'}`).join('\n')}
    
    **Next-step guidelines**
    
    Create a new question that is not related to the topics the mentor rejected answering.`
    });

    // Add final instruction
    payload.push({
      role: 'user',
      content: "Based on the mentor's profile, full conversation history, and latest answer, generate a thoughtful follow-up question that explores a NEW topic/area with actionable advice specific to their industry/role. Avoid repeating themes from previous questions."
    });

    // Use direct OpenAI API call to ensure no streaming
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: payload,
      temperature: 0.7,
      max_tokens: 200,
      stream: false, // Explicitly disable streaming
    });

    // Extract the response content
    const completionText = completion.choices[0]?.message?.content || '';

    let aiResponse;
    try {
      // First, try to strip markdown code blocks if present
      let jsonText = completionText.trim();

      // Remove markdown code blocks (```json ... ```) if present
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }

      aiResponse = JSON.parse(jsonText);
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
            question: questionMatch ? questionMatch[1] : 'Failed to generate a question. Please navigate to the next question instead.',
            preamble: 'Thank you for sharing your insights.',
          };
        }
      } else {
        logger.error('[generateNextQuestion] No valid JSON found in AI response:', completionText);
        throw new Error('AI response did not contain valid JSON. Please refresh the page and try again.');
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
    };

    res.json(finalResponse);
  } catch (err) {
    logger.error('[generateNextQuestion] Error:', err);
    return handleError(res, { text: 'Error generating next question' });
  }
}

/**
 * @route GET /api/mentor-interview/:access_token
 */
async function getMentorInterest(req, res) {
  try {
    res.json(req.mentorInterest);
  } catch (err) {
    return handleError(res, { text: 'Error fetching mentor interest' });
  }
}

/**
 * @route POST /api/mentor-interview/:access_token/generate-intro
 */
async function generatePersonalizedIntro(req, res) {
  try {
    const mentorProfile = req.mentorInterest;

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
"As [article] [job title] at [proper company name with correct articles], your story offers critical guidance for women in their 20s navigating the early stages of their professional journey."

Grammar rules:
- Use "a" or "an" for common job titles (e.g., "As a Marketing Manager")
- Use "the" for unique positions (e.g., "As the CEO", "As the First Lady", "As the President")
- Add "the" before company names when appropriate (e.g., "the White House", "the United Nations", "the New York Times")
- Keep the ending exactly as: "your story offers critical guidance for women in their 20s navigating the early stages of their professional journey."

Return ONLY the complete sentence, no extra punctuation, nothing else.`,
      },
    ];

    // Generate the introduction
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: payload,
      temperature: 0.1,
      max_tokens: 150,
      stream: false,
    });

    const intro = completion.choices[0]?.message?.content?.trim();

    if (!intro) {
      return handleError(res, { text: 'Failed to generate personalized introduction' });
    }

    res.json({ introduction: intro });
  } catch (err) {
    logger.error('[generatePersonalizedIntro] Error:', err);
    return handleError(res, { text: 'Error generating personalized introduction' });
  }
}

/**
 * @route GET /api/mentor-interview/:access_token/responses
 * @desc Get all mentor responses for review
 * @access Public (token validated)
 */
async function getAllMentorResponses(req, res) {
  try {
    const mentor_interest_id = req.mentorInterest._id;
    const { all } = req.query;

    let filter = { mentor_interest: mentor_interest_id };

    if (!all) {
      filter.status = 'pending';
    }

    const responses = await MentorResponse.find(filter)
      .sort({ stage_id: 1 })
      .lean();

    res.json(responses);
  } catch (err) {
    return handleError(res, { text: 'Error fetching mentor responses' });
  }
}

/**
 * @route POST /api/mentor-interview/:access_token/generate-insights
 * @desc Generate personalized insights summary from responses
 * @access Public (token validated)
 */
async function generateInsights(req, res) {
  try {
    // Get all responses for this mentor
    const responses = await MentorResponse.find({
      mentor_interest: req.mentorInterest._id,
      response_text: { $exists: true, $ne: '' }
    }).sort({ stage_id: 1 });

    if (responses.length === 0) {
      return handleError(res, { text: 'No responses found to analyze' }, 400);
    }

    // Prepare the data for ChatGPT
    const responseTexts = responses.map((r, index) =>
      `Question ${index + 1}: ${r.question}\nResponse: ${r.response_text}`
    ).join('\n\n');

    const mentorInfo = req.mentorInterest;
    const mentorName = mentorInfo.firstName || 'this mentor';

    // Create the prompt for ChatGPT
    const prompt = `You are MELD’s AI interviewer, closing a mentorship interview with ${mentorName}, a ${mentorInfo.jobTitle || 'professional'} at ${mentorInfo.company || 'their company'}.

    Your job: Write a concise closing message (1–2 sentences, 65 words max) that will appear on MELD’s “Interview Complete” page.
    
    How to write it:
    - Start with: “Thank you, ${mentorName}, for…” and include a “from [specific starting point or experience], to [specific achievement, insight, or result],” drawn directly from the mentor’s answers.
    - Briefly reflect on how that story or lesson will help or resonate with young women on MELD’s platform—be clear and specific, not generic.
    - Keep the tone warm, grounded, and human—not formal or flowery.
    - End with a simple appreciation and the sense that their experience matters to MELD’s community.
    
    Do **not** restate MELD’s mission, general leadership traits, or use filler like “your story truly embodies…”—focus on what they actually said.
    
    End the message with a new paragraph saying exactly this:
    Thank you for being part of this movement and inspiring the next generation of women leaders.💜
    
    Here are their responses:
    
    ${responseTexts}`;    

    // Call ChatGPT API
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!chatResponse.ok) {
      throw new Error(`ChatGPT API error: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const insights = chatData.choices[0]?.message?.content || 'Thank you for your valuable insights!';

    // Mark all non-rejected responses as submitted
    // Our partial unique index ensures only one non-rejected response per stage exists
    await MentorResponse.updateMany(
      {
        mentor_interest: req.mentorInterest._id,
        status: { $ne: 'rejected' }
      },
      { status: 'submitted' }
    );

    // Update the main MentorInterest status to 'submitted' 
    // This marks the interview as complete and starts the 12-hour access timer
    await MentorInterest.findByIdAndUpdate(
      req.mentorInterest._id,
      { 
        status: 'submitted',
        updatedAt: new Date() // Explicitly set updatedAt for the 12-hour timer
      }
    );

    res.json({
      insights,
      mentor_name: mentorName,
      response_count: responses.length
    });
  } catch (err) {
    logger.error('[generateInsights] Error:', err);
    return handleError(res, { text: 'Error generating insights' });
  }
}

/**
 * @route DELETE /api/mentor-interest/:id
 * @desc Delete a mentor interest submission (ADMIN)
 * @access Private (requires JWT)
 */
async function deleteMentorInterest(req, res) {
  try {
    const { id } = req.params;

    // Find the mentor interest to check if it exists
    const mentorInterest = await MentorInterest.findById(id);
    if (!mentorInterest) {
      return handleError(res, { text: 'Mentor interest submission not found' }, 404);
    }

    // Count associated mentor responses before deletion
    const responseCount = await MentorResponse.countDocuments({ mentor_interest: id });
    logger.debug(`[deleteMentorInterest] Found ${responseCount} associated mentor responses for mentor interest ${id}`);

    // Delete all associated mentor responses first
    const deleteResponsesResult = await MentorResponse.deleteMany({ mentor_interest: id });
    logger.debug(`[deleteMentorInterest] Deleted ${deleteResponsesResult.deletedCount} mentor responses for mentor interest ${id}`);

    // Delete the mentor interest submission
    await MentorInterest.findByIdAndDelete(id);
    logger.debug(`[deleteMentorInterest] Successfully deleted mentor interest ${id} and ${deleteResponsesResult.deletedCount} associated responses`);

    res.json({
      status: 'ok',
      message: `Mentor interest submission and ${deleteResponsesResult.deletedCount} associated responses deleted successfully`,
      deletedResponses: deleteResponsesResult.deletedCount
    });
  } catch (err) {
    logger.error('[deleteMentorInterest] Error:', err);
    return handleError(res, { text: 'Error deleting mentor interest submission' });
  }
}

/**
 * @route POST /api/mentor-interest/:id/generate-token
 * @desc Generate access token for existing mentor interest submission (ADMIN)
 * @access Private (requires JWT)
 */
async function generateAccessToken(req, res) {
  try {
    const { id } = req.params;

    // Find the mentor interest submission
    const mentorInterest = await MentorInterest.findById(id);
    if (!mentorInterest) {
      return handleError(res, { text: 'Mentor interest submission not found' }, 404);
    }

    // Generate new access token
    const crypto = require('crypto');
    const newAccessToken = crypto.randomBytes(32).toString('hex');

    // Update the submission with new token
    const updatedMentorInterest = await MentorInterest.findByIdAndUpdate(
      id,
      {
        accessToken: newAccessToken
      },
      { new: true }
    ).select('+accessToken');

    logger.info(`[generateAccessToken] Generated new access token for mentor interest ${id}`);

    res.json({
      status: 'ok',
      message: 'Access token generated successfully',
      accessToken: updatedMentorInterest.accessToken
    });
  } catch (err) {
    logger.error('[generateAccessToken] Error:', err);
    return handleError(res, { text: 'Error generating access token' });
  }
}

/**
 * @route GET /api/mentor-interest/admin-responses
 * @desc Get all mentor responses with mentor details (ADMIN)
 * @access Private (requires JWT)
 */
async function getAdminMentorResponses(req, res) {
  try {
    // Use aggregation to join mentor responses with mentor interest data
    const responses = await MentorResponse.aggregate([
      {
        $lookup: {
          from: 'mentorinterests', // MongoDB collection name (lowercase + 's')
          localField: 'mentor_interest',
          foreignField: '_id',
          as: 'mentor'
        }
      },
      {
        $unwind: '$mentor' // Flatten the mentor array
      },
      {
        $match: {
          response_text: { $exists: true, $ne: '' } // Only include responses with actual text
        }
      },
      {
        $project: {
          _id: 1,
          stage_id: 1,
          question: 1,
          preamble: 1,
          response_text: 1,
          status: 1,
          createdAt: 1,
          // updatedAt: 1, // Removed updatedAt field
          mentor_id: '$mentor._id',
          mentor_name: {
            $concat: ['$mentor.firstName', ' ', { $ifNull: ['$mentor.lastName', ''] }]
          },
          mentor_email: '$mentor.email',
          mentor_jobTitle: '$mentor.jobTitle',
          mentor_company: '$mentor.company',
          mentor_accessToken: '$mentor.accessToken' // Include access token for direct links
        }
      },
      {
        $sort: { updatedAt: -1 } // Sort by response update date, most recent first
      }
    ]);

    res.json(responses);
  } catch (err) {
    logger.error('[getAdminMentorResponses] Error:', err);
    return handleError(res, { text: 'Error fetching mentor responses' });
  }
}

/**
 * @route PATCH /api/mentor-interest/:id
 * @desc Update mentor interest status (ADMIN)
 * @access Private (requires JWT)
 */
async function updateMentorInterestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'submitted', 'rejected', 'interview started'];
    if (!status || !validStatuses.includes(status)) {
      return handleError(res, { text: 'Invalid status. Must be one of: ' + validStatuses.join(', ') }, 400);
    }

    // Find and update the mentor interest
    const updatedMentorInterest = await MentorInterest.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedMentorInterest) {
      return handleError(res, { text: 'Mentor interest submission not found' }, 404);
    }

    logger.info(`[updateMentorInterestStatus] Updated status for mentor interest ${id} to ${status}`);

    res.json({
      status: 'ok',
      message: 'Status updated successfully',
      mentorInterest: updatedMentorInterest
    });
  } catch (err) {
    logger.error('[updateMentorInterestStatus] Error:', err);
    return handleError(res, { text: 'Error updating mentor interest status' });
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
  getAllMentorResponses,
  generateInsights,
  validateAccessToken,
  deleteMentorInterest,
  generateAccessToken,
  getAdminMentorResponses,
  updateMentorInterestStatus,
};
