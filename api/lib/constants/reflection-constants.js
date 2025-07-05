// Shared constants for reflection functionality
// Keep in sync with client/src/common/reflection-constants.ts

const EMOTIONAL_STATES = {
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
    description: 'Emotionally challenging day.'
  },
  other: {
    label: 'Other',
    description: 'Describe in your own words.'
  },
};

const PRIORITY_LABELS = {
  deepWork: 'Deep Work',
  collaboration: 'Collaboration',
  learning: 'Learning',
  admin: 'Admin',
  wellbeing: 'Well-being',
  relationships: 'Relationships',
  creative: 'Creative Play',
  rest: 'Rest / Reset',
  mindset: 'Mindset Shift',
};

module.exports = {
  EMOTIONAL_STATES,
  PRIORITY_LABELS,
}; 