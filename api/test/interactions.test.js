const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserInteraction = require('../models/UserInteraction');
const MentorFeedItem = require('../models/MentorFeedItem');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await UserInteraction.deleteMany({});
  await MentorFeedItem.deleteMany({});
});

describe('UserInteraction Model', () => {
  test('should create a valid interaction', async () => {
    const interactionData = {
      user: new mongoose.Types.ObjectId(),
      kind: 'fragment',
      promptText: 'What\'s on your mind?',
      responseText: 'I feel productive today',
      captureMethod: 'text'
    };

    const interaction = await UserInteraction.create(interactionData);
    
    expect(interaction.kind).toBe('fragment');
    expect(interaction.promptText).toBe('What\'s on your mind?');
    expect(interaction.responseText).toBe('I feel productive today');
    expect(interaction.captureMethod).toBe('text');
    expect(interaction.isPrivate).toBe(false);
    expect(interaction.capturedAt).toBeInstanceOf(Date);
  });

  test('should create interaction with numeric answer', async () => {
    const interactionData = {
      user: new mongoose.Types.ObjectId(),
      kind: 'compass',
      promptText: 'How is your energy level?',
      numericAnswer: 4,
      captureMethod: 'slider'
    };

    const interaction = await UserInteraction.create(interactionData);
    
    expect(interaction.kind).toBe('compass');
    expect(interaction.numericAnswer).toBe(4);
    expect(interaction.captureMethod).toBe('slider');
  });

  test('should create interaction linked to mentor feed', async () => {
    const userId = new mongoose.Types.ObjectId();
    const mentorFeedId = new mongoose.Types.ObjectId();
    
    const interactionData = {
      user: userId,
      mentorFeedId: mentorFeedId,
      kind: 'goal',
      promptText: 'What is your 6-month goal?',
      responseText: 'Ship MVP by October',
      captureMethod: 'text'
    };

    const interaction = await UserInteraction.create(interactionData);
    
    expect(interaction.mentorFeedId.toString()).toBe(mentorFeedId.toString());
    expect(interaction.kind).toBe('goal');
  });

  test('should find interactions by user', async () => {
    const userId = new mongoose.Types.ObjectId();
    
    // Create first interaction
    const firstInteraction = await UserInteraction.create({
      user: userId,
      kind: 'fragment',
      promptText: 'Test 1',
      responseText: 'Response 1',
      capturedAt: new Date(Date.now() - 1000) // 1 second ago
    });

    // Wait a bit and create second interaction
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const secondInteraction = await UserInteraction.create({
      user: userId,
      kind: 'compass',
      promptText: 'Test 2',
      numericAnswer: 3,
      capturedAt: new Date() // Now
    });

    const interactions = await UserInteraction.findByUser(userId.toString());
    
    expect(interactions).toHaveLength(2);
    
    // The most recent should be first (compass)
    expect(interactions[0].kind).toBe('compass');
    expect(interactions[1].kind).toBe('fragment');
  }, 10000);
});

describe('MentorFeedItem Model', () => {
  test('should create a valid feed item', async () => {
    const feedItemData = {
      trigger: {
        type: 'onboarding',
        refId: null
      },
      type: 'todo',
      todoKind: 'goal',
      promptText: 'What is one ambitious goal you\'d love to nail in six months?',
      systemPrompt: 'Help the user define a clear, achievable goal',
      priority: 3,
      urgency: 'medium'
    };

    const feedItem = await MentorFeedItem.create(feedItemData);
    
    expect(feedItem.type).toBe('todo');
    expect(feedItem.todoKind).toBe('goal');
    expect(feedItem.promptText).toBe('What is one ambitious goal you\'d love to nail in six months?');
    expect(feedItem.status.feedState).toBe('new');
    expect(feedItem.status.todoState).toBe('pending');
  });

  test('should update feed item status', async () => {
    const feedItem = await MentorFeedItem.create({
      trigger: { type: 'manual', refId: null },
      type: 'todo',
      promptText: 'Test prompt'
    });

    const updatedItem = await MentorFeedItem.updateStatus(feedItem._id, {
      'status.todoState': 'answered',
      'status.feedState': 'clicked'
    });

    expect(updatedItem.status.todoState).toBe('answered');
    expect(updatedItem.status.feedState).toBe('clicked');
  });
}); 