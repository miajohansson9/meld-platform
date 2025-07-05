const express = require('express');
const { requireJwtAuth, validateInteraction } = require('~/server/middleware');
const { logger } = require('~/config');
const UserInteraction = require('~/models/UserInteraction');
const MentorFeedItem = require('~/models/MentorFeedItem');
const { upsertCompassView, upsertWinsView } = require('~/workers/viewBuilder');

const router = express.Router();
router.use(requireJwtAuth);

// POST /api/interactions - Create a new interaction
router.post('/', validateInteraction, async (req, res) => {
  try {
    const userId = req.user.id;
    const interactionData = {
      ...req.validatedInteraction,
      user: userId,
      capturedAt: req.validatedInteraction.capturedAt || new Date()
    };

    const interaction = await UserInteraction.createInteraction(interactionData);

    // Update views immediately (fallback in case change stream worker isn't running)
    try {
      if (interaction.kind === 'compass') {
        await upsertCompassView(interaction);
      } else if (interaction.kind === 'win') {
        await upsertWinsView(interaction);
      }
    } catch (viewError) {
      logger.error('Error updating views:', viewError);
      // Don't fail the request if view update fails
    }

    // If this interaction is answering a mentor feed item, update the feed item
    if (interaction.mentorFeedId) {
      await MentorFeedItem.updateStatus(interaction.mentorFeedId, {
        'status.todoState': 'answered',
        answeredInteraction: interaction._id,
        completedAt: new Date()
      });
    }

    res.status(201).json(interaction);
  } catch (error) {
    logger.error('Error creating interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/interactions - Get user interactions with filtering
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      kind,
      page = 1,
      limit = 25,
      sortBy = 'capturedAt',
      sortDirection = 'desc'
    } = req.query;

    const options = {
      kind,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortDirection
    };

    const interactions = await UserInteraction.findByUser(userId, options);

    res.status(200).json({
      interactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: interactions.length === parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/interactions/:id - Get a specific interaction
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const interaction = await UserInteraction.findOne({
      _id: id,
      user: userId
    }).populate('mentorFeedId').lean();

    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    res.status(200).json(interaction);
  } catch (error) {
    logger.error('Error fetching interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/interactions/:id - Update an interaction
router.put('/:id', validateInteraction, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const interaction = await UserInteraction.findOne({
      _id: id,
      user: userId
    });

    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    // Update the interaction
    Object.assign(interaction, req.validatedInteraction);
    await interaction.save();

    res.status(200).json(interaction);
  } catch (error) {
    logger.error('Error updating interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/interactions/:id - Delete an interaction
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const interaction = await UserInteraction.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    // If this was answering a mentor feed item, reset the feed item
    if (interaction.mentorFeedId) {
      await MentorFeedItem.updateStatus(interaction.mentorFeedId, {
        'status.todoState': 'pending',
        answeredInteraction: null,
        completedAt: null
      });
    }

    res.status(200).json({ message: 'Interaction deleted successfully' });
  } catch (error) {
    logger.error('Error deleting interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 