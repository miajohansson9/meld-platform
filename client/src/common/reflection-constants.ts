// Shared constants for reflection functionality
// Used by both frontend and backend for consistency

export const EMOTIONAL_STATES = {
  greatDay: {
    label: 'Great Day',
    description: 'Felt energized and proud.'
  },
  solidAndSteady: {
    label: 'Solid & Steady',
    description: 'Calm, balanced, or intentionally paced.'
  },
  mixedFeelings: {
    label: 'Mixed Feelings',
    description: 'A blend of ups and downs—still finding clarity.'
  },
  drained: {
    label: 'Drained',
    description: 'Feeling low on emotional or physical energy.'
  },
  scattered: {
    label: 'Scattered',
    description: 'Pulled in many directions; hard to stay focused.'
  },
  heavy: {
    label: 'Heavy',
    description: 'Emotionally challenging or reflective day.'
  },
  other: {
    label: 'Other',
    description: 'Describe in your own words.'
  },
} as const;


export type EmotionalState = keyof typeof EMOTIONAL_STATES;

export const EMOTIONAL_STATES_ARRAY = Object.entries(EMOTIONAL_STATES).map(([value, config]) => ({
  value: value as EmotionalState,
  label: config.label,
  description: config.description,
}));

export const PRIORITY_LABELS = {
  deepWork: 'Deep Work',
  collaboration: 'Collaboration',
  learning: 'Learning',
  admin: 'Admin',
  wellbeing: 'Well-being',
  relationships: 'Relationships',
  creative: 'Creative Play',
  rest: 'Rest / Reset',
  mindset: 'Mindset Shift',
} as const;

export type Priority = keyof typeof PRIORITY_LABELS; 