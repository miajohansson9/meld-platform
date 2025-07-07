const { z } = require('zod');

// Zod schema for user interaction validation
const interactionSchema = z.object({
  kind: z.enum(['onboarding', 'fragment', 'reflection', 'compass', 'goal', 'win']),
  promptText: z.string().optional(),
  responseText: z.string().optional(),
  numericAnswer: z.number().optional(),
  captureMethod: z.enum(['text', 'slider', 'voice', 'image', 'web']).optional(),
  interactionMeta: z.record(z.any()).optional(),
  mentorFeedId: z.string().optional(),
  isPrivate: z.boolean().optional(),
  capturedAt: z.date().optional()
}).refine(
  (data) => {
    // Either responseText or numericAnswer must be provided
    return data.responseText || data.numericAnswer !== undefined;
  },
  {
    message: "Either responseText or numericAnswer must be provided",
    path: ["responseText", "numericAnswer"]
  }
);

const validateInteraction = async (req, res, next) => {
  try {
    const validatedData = interactionSchema.parse(req.body);
    req.validatedInteraction = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    return res.status(500).json({ error: 'Validation error' });
  }
};

module.exports = validateInteraction; 