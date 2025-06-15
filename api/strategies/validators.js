const { z } = require('zod');

const allowedCharactersRegex = new RegExp(
  '^[' +
    'a-zA-Z0-9_.@#$%&*()' + // Basic Latin characters and symbols
    '\\p{Script=Latin}' + // Latin script characters
    '\\p{Script=Common}' + // Characters common across scripts
    '\\p{Script=Cyrillic}' + // Cyrillic script for Russian, etc.
    '\\p{Script=Devanagari}' + // Devanagari script for Hindi, etc.
    '\\p{Script=Han}' + // Han script for Chinese characters, etc.
    '\\p{Script=Arabic}' + // Arabic script
    '\\p{Script=Hiragana}' + // Hiragana script for Japanese
    '\\p{Script=Katakana}' + // Katakana script for Japanese
    '\\p{Script=Hangul}' + // Hangul script for Korean
    ']+$', // End of string
  'u', // Use Unicode mode
);
const injectionPatternsRegex = /('|--|\$ne|\$gt|\$lt|\$or|\{|\}|\*|;|<|>|\/|=)/i;

const usernameSchema = z
  .string()
  .min(2)
  .max(80)
  .refine((value) => allowedCharactersRegex.test(value), {
    message: 'Invalid characters in username',
  })
  .refine((value) => !injectionPatternsRegex.test(value), {
    message: 'Potential injection attack detected',
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .refine((value) => value.trim().length > 0, {
      message: 'Password cannot be only spaces',
    }),
});

const registerSchema = z
  .object({
    name: z.string().min(3).max(80),
    username: z
      .union([z.literal(''), usernameSchema])
      .transform((value) => (value === '' ? null : value))
      .optional()
      .nullable(),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(128)
      .refine((value) => value.trim().length > 0, {
        message: 'Password cannot be only spaces',
      }),
    confirm_password: z
      .string()
      .min(8)
      .max(128)
      .refine((value) => value.trim().length > 0, {
        message: 'Password cannot be only spaces',
      }),
    signup_code: z.string().optional(),
  })
  .superRefine(({ confirm_password, password, signup_code }, ctx) => {
    if (confirm_password !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'The passwords did not match',
      });
    }
    
    // Check signup code if SIGN_UP_CODE environment variable is set
    if (process.env.SIGN_UP_CODE) {
      if (!signup_code) {
        ctx.addIssue({
          code: 'custom',
          message: 'Signup code is required',
          path: ['signup_code'],
        });
      } else if (signup_code !== process.env.SIGN_UP_CODE) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid signup code',
          path: ['signup_code'],
        });
      }
    }
  });

module.exports = {
  loginSchema,
  registerSchema,
};
