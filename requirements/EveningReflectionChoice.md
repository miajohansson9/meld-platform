## “Generate Reflection Question” — Implementation Spec

*(Author: “Fidji” product POV; written for an AI/full-stack engineer working in the existing Node/Express + Mongo + OpenAI stack you shared.)*

---

### 1 · Product Flow Overview

1. **User arrives** on *Evening Reflection* card.
2. **Step 1 – Choose topics**

   * A horizontal pill menu appears **above** the progress chips.
   * Pills are multi-select (toggle). Options (from previous menu):

     ```ts
     type ReflectionTopic =
       | 'celebrateWin'
       | 'practiceGratitude'
       | 'spotLesson'
       | 'energyCheck'
       | 'removeBlocker'
       | 'contributionMade'
       | 'emotionalSnapshot'
       | 'planTomorrow'
       | 'mindsetReset'
       | 'systemTweak';
     ```

     UX copy on pills (user-facing label):

     > Celebrate a Win · Practice Gratitude · Spot a Lesson · Energy Check-In · Remove a Blocker · Contribution Made · Emotional Snapshot · Plan Tomorrow · Mindset Reset · System Tweak
3. **Step 2 – Button** “Generate reflection question →” (disabled until ≥1 pill selected).
4. **Step 3 – AI question appears**

   * Returned question is rendered as bold heading directly above the Reflection text-area.
   * If multiple pills chosen, AI merges them into one compound question.
   * Placeholder of textarea is replaced by the generated question; focus jumps into the box.
5. **User writes answer → Save Reflection (existing flow).**

---

### 2 · Front-End Requirements

#### 2.1 Component changes

* **`ReflectionSegment.tsx`**

  1. Add state:

     ```ts
     const [topics, setTopics] = useState<ReflectionTopic[]>([]);
     const [genQuestion, setGenQuestion] = useState<string>('');
     const [generating, setGenerating] = useState(false);
     ```
  2. **Topic pill UI** (reuse chip styles):

     ```jsx
     {reflectionTopics.map(t => (
        <Chip
          key={t.value}
          label={t.label}
          selected={topics.includes(t.value)}
          onClick={() => toggleTopic(t.value)}
        />
     ))}
     ```
  3. **Generate button**

     ```jsx
     <Button
        disabled={!topics.length || generating}
        onClick={handleGenerate}
        variant="secondary"
     >
       {generating ? <Loader2 …/> : 'Generate reflection question'}
     </Button>
     ```
  4. **On success** set `genQuestion` then:

     ```jsx
     setImprovementNote('');          // clear box
     textareaRef.current?.focus();
     ```

     Render question heading if `genQuestion` non-empty.

#### 2.2 Front-end API call

```ts
POST /api/reflection/generate-question
{
  date: 'YYYY-MM-DD',
  intention: currentCompass.priorityNote,      // string
  topics: ['celebrateWin','energyCheck']       // ReflectionTopic[]
}
```

Expect shape:

```json
{
  "question": "What specific moment made you proud while working on your deep-work focus today, and when did your energy feel highest?"
}
```

#### 2.3 Error UX

If backend returns 429/500 → toast: *“Couldn’t generate a question, try again in a minute.”* Keep user selections.

---

### 3 · Backend Additions

#### 3.1 Route & Controller

```
POST /api/reflection/generate-question
Auth: standard Bearer JWT
```

Create **`ReflectionQuestionController.js`**:

```js
const { OpenAI } = require('openai');
const VALID_TOPICS = {
  celebrateWin: 'Celebrate a Win',
  practiceGratitude: 'Practice Gratitude',
  spotLesson: 'Spot a Lesson',
  energyCheck: 'Energy Check-in',
  removeBlocker: 'Remove a Blocker',
  contributionMade: 'Contribution Made',
  emotionalSnapshot: 'Emotional Snapshot',
  planTomorrow: 'Plan Tomorrow',
  mindsetReset: 'Mindset Reset',
  systemTweak: 'System Tweak',
};

exports.generateReflectionQuestion = async (req, res) => {
  try {
    const { date, intention = '', topics = [] } = req.body;
    if (!Array.isArray(topics) || !topics.length) {
      return res.status(400).json({ error: 'topics array required' });
    }
    // 1 · build natural-language topic list
    const topicLabels = topics.map(t => VALID_TOPICS[t]).filter(Boolean);
    // 2 · OpenAI prompt
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [
      {
        role: 'system',
        content: `
You are MELD's reflection-coach AI. 
Given a user's morning intention and chosen reflection themes, 
craft ONE engaging, positive, 1-sentence evening reflection prompt. 
It must: 
 • Reference the intention verbatim (if provided)  
 • Weave in ALL selected themes below.  
 • Be no more than 40 words.  
Return ONLY plain text.`
      },
      {
        role: 'user',
        content: `Morning intention: "${intention || 'N/A'}"\nChosen themes: ${topicLabels.join(', ')}`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 80,
      stream: false,
    });

    const question = completion.choices?.[0]?.message?.content?.trim();
    if (!question) throw new Error('No content from OpenAI');

    res.json({ question });
  } catch (err) {
    logger.error('[generateReflectionQuestion] Error:', err);
    res.status(500).json({ error: 'Failed to generate question' });
  }
};
```

#### 3.2 Route wiring

```js
// src/routes/reflection.js
const router = require('express').Router();
const { validateJWT } = require('../middleware/auth');
const ReflectionQuestionController = require('../controllers/ReflectionQuestionController');

router.post('/generate-question', validateJWT, ReflectionQuestionController.generateReflectionQuestion);

module.exports = router;
```

Mount in `app.js`:

```js
app.use('/api/reflection', require('./routes/reflection'));
```

---

### 4 · Security & Rate-limit

* Re-use `validateJWT` middleware.
* Add simple Redis rate-limit (e.g., 5 requests / user / min) to prevent prompt-spamming.

---

### 5 · Unit Tests

1. **Valid request** returns 200 & question string containing all topic keywords.
2. **No topics** → 400.
3. **Rate-limit** returns 429 after >5 hits/min.
4. **Auth missing** → 401.

---

### 6 · Deployment Notes

* No DB schema change required.
* ENV var `OPENAI_API_KEY` already present.
* Ensure new route is included in CORS allow-list on frontend host.

---

### 7 · Timeline Estimate

| Task                         | Owner  | ETA     |
| ---------------------------- | ------ | ------- |
| FE pill UI + generate button | FE dev | 0.5 day |
| BE controller + tests        | BE dev | 0.5 day |
| Integration & QA             | Both   | 0.5 day |

*Total ≈ 1.5 engineering days.*

Ship it and let users craft reflections that *feel theirs*—boosting adoption and data richness for the coach.
