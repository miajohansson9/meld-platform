Below is the **fully-rewritten implementation guide**—every reference to **`promptId`** has been removed, every interaction now links back (when relevant) with **`mentorFeedId`**, and all examples / workers / view builders are updated accordingly.

---

## ✦ Naming Conventions Used Throughout

| Layer                       | Collection / Table name         | Why                                  |
| --------------------------- | ------------------------------- | ------------------------------------ |
| Raw user events             | **`user_interactions`**         | “one row per Q→A” keeps intent clear |
| Rule / AI feed cards        | **`mentor_feed_items`**         | What appears in the Mentor Feed      |
| AI analysis per interaction | **`interaction_analyses`**      | Keeps CRUD vs. AI concerns separate  |
| Read-optimised views        | **`compass_view`, `wins_view`** | Ultra-fast charts / galleries        |

*(Vector embeddings remain out-of-scope for these phases.)*

---

# PHASE 0 – PROJECT SCAFFOLD (2 days)

### 0.1  `user_interactions` model

```ts
// src/models/userInteraction.ts
const userInteractionSchema = new Schema({
  /* ─────────────── FOREIGN KEYS ─────────────── */
  user:    { type: Types.ObjectId, ref: 'User',  required: true, index: true },
  mentorFeedId: { type: Types.ObjectId, ref: 'MentorFeedItem', default: null },
  /* if the answer did NOT come from a feed card (e.g. onboarding wizard or daily compass),
     mentorFeedId remains null */

  /* ─────────────── CORE DATA ─────────────── */
  kind:    {
    type : String,
    enum : ['onboarding', 'fragment', 'compass', 'goal', 'win'],
    required: true,
    index : true
  },
  promptText:    String,                        // literal question shown (UI copy)
  responseText:  String,                        // free-text user answer
  numericAnswer: Number,                        // for sliders (mood, energy …)
  captureMethod: {
    type: String,
    enum: ['text', 'slider', 'voice', 'image', 'web'],
    default: 'text'
  },
  interactionMeta: {},                          // flexible JSON blob (e.g. slider min/max)

  /* ─────────────── FLAGS & DATES ─────────────── */
  isPrivate:   { type: Boolean, default: false },
  capturedAt:  { type: Date,    default: Date.now, index: true }
}, { timestamps: true });

export default model('UserInteraction', userInteractionSchema);
```

#### Practical Examples

| Scenario                                                                                            | `user_interactions` fields                                                                                                     |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Onboarding Q 1**: “Why are you here?”                                                             | `{ kind:'onboarding', promptText:'Why are you here?', responseText:'I need clarity on my career path', captureMethod:'text' }` |
| **Daily compass / energy slider** 4                                                                 | `{ kind:'compass', promptText:'Energy level (1-5)', numericAnswer:4, captureMethod:'slider' }`                                 |
| **Mentor Feed card** “What’s your 6-month goal?” (card id `64ff…`) → user answers “Ship MVP by Oct” | `{ kind:'goal', mentorFeedId:'64ff…', promptText:'What’s your 6-month goal?', responseText:'Ship MVP by Oct' }`                |

### 0.2  Express routes (CRUD layer)

* `POST /api/interactions` – create
* `GET  /api/interactions?kind=fragment&page=1`
* Zod validation: (`kind` required; **either** `responseText` **or** `numericAnswer`).

---

# PHASE 1 – MVP CRUD & BASIC VIEWS (1 week)

> **Goal:** UI loads live data. No AI yet.

### 1.1  Real-time views via Change Stream

```ts
// src/workers/viewBuilder.ts
changeStream.on('insert', async doc => {
  if (doc.kind === 'compass' && doc.promptText.includes('Mood'))    upsertCompassView(doc);
  if (doc.kind === 'win'     && doc.promptText.includes('Title'))   upsertWinsView(doc);
});
```

#### `compass_view`

```ts
{
  user,
  date,                          // yyyy-mm-dd (local)
  mood, energy, alignment,       // pulled from matching numericAnswer rows
  reflectionInteractionId        // ObjectId of free-text reflection, if any
}
```

#### `wins_view`

```ts
{
  user,
  achievedAt,                    // date parsed from title/description captures
  titleInteractionId,            // ObjectId
  descriptionInteractionId
}
```

### 1.2  Seed **mentor\_feed\_items** (manual batch)

```ts
{
  /* ─── Identity ─── */
  _id: ObjectId,
  user       : null,                 // null = template card all new users get
  origin     : 'manual',
  trigger    : { type:'onboarding', refId:null },

  /* ─── Copy & Kind ─── */
  type       : 'todo',
  todoKind   : 'goal',
  promptText : 'What is one ambitious goal you’d love to nail in six months?',
  systemPrompt: String, // system prompt for the ai to have more context/instructions for conversation
  /* ─── CTA State ─── */
  cta        : { primaryLabel:'Answer', secondaryLabel:null, dueAt:null },
  status     : {
    feedState:'new',            // new | seen | clicked | dismissed
    todoState:'pending'         // pending | answered | scheduled | skipped | snoozed
  },
  answeredInteraction : null,
  completedAt         : null,

  /* ─── Ordering ─── */
  priority:3, urgency:'medium', relevanceScore:0.5, expiresAt:null,

  /* ─── Timestamps ─── */
  deliveredAt:null, createdAt:new Date(), updatedAt:new Date(), snoozedUntil: new Date()
}
```

When the user submits an answer the FE sets `mentorFeedId` in the interaction **and** BE sets:
`todoState:'answered'`, `answeredInteraction:ObjectId`, `completedAt:new Date()`.

**Indexes**

```ts
mentorFeedItemSchema.index({ user:1, 'status.feedState':1, priority:-1 });
mentorFeedItemSchema.index({ expiresAt:1 }, { expireAfterSeconds:0 });
```

---

# PHASE 2 – LITE ANALYSIS & FOLLOW-UPS (2 weeks)

> **Goal:** classify intent, pull entities, flag problems, auto-create follow-ups.

### 2.1  `interaction_analyses` model

```ts
const interactionAnalysis = new Schema({
  /* FKs */
  user:            { type: Types.ObjectId, ref: 'User', index:true },
  sourceInteraction:{ type: Types.ObjectId, ref:'UserInteraction', unique:true, required:true },

  /* NLP basics */
  sentiment: { score:Number, label:String },      // 0 negative to 10 super positive
  keywords : [ String ],

  /* 1) Intent */
  intent: {
    type: String,
    enum: ['problem','goal_definition','plan','reflection','insight','question','celebration','other'],
    required:true
  },

  /* 2) Tags */
  tags: [ String ],

  /* 3) Context entities */
  context: {
    people : [ String ],
    places : [ String ],
    events : [ String ],
    topics : [ String ],
    timeRef: String,
    timeRefDate: Date
  },

  /* 4) Problem struct (only if intent==='problem') */
  problem: {
    summary       : String,
    severity      : { type:Number, min:1, max:5 },
    needsFollowUp : Boolean,
    resolvedBy    : { type:Types.ObjectId, ref:'UserInteraction' }
  },

  /* 5) Significance & scheduling */
  significance  : { type:Number, min:0, max:10, default:5 },
  followUpDate  : Date,   // nullable

  processedAt   : { type:Date, default:Date.now },
  modelVersion  : String
});
```

### 2.2  BullMQ worker pipeline

1. **Producer** – in `POST /interactions` handler

   ```ts
   if (env.ANALYSIS_ENABLED) analysisQueue.add('analyze', { interactionId: doc._id });
   ```

2. **Worker** (`analysisQueue.process`)

   * Call OpenAI with prompt to produce JSON {sentiment, intent, tags, …}.
   * Save `interaction_analysis`.
   * **If** `intent==='problem' && needsFollowUp===true`

     ```ts
     const feed = await MentorFeedItem.create({
       user: doc.user,
       origin:'ai',
       trigger:{ type:'analysis', refId: ia._id },
       type:'follow_up',
       kind:'problem',
       systemPrompt: 'Specific context and instructions around this problem to know about',
       promptText:`You mentioned ${ia.problem.summary}. Any progress or next step?`,
       priority:4, urgency:'high',
       expiresAt: ia.followUpDate ?? addDays(new Date(), 7)
     });
     ```

### 2.3  Problem resolution monitor

*On every new interaction*

```ts
const openProblems = await InteractionAnalysis.find({
  user:uid, 'problem.needsFollowUp':true
}).sort({processedAt:-1}).limit(10);

openProblems.forEach(async p => {
  if (isResolved(p, newInteraction)) {
     p.set({'problem.needsFollowUp':false,'problem.resolvedBy':newInteraction._id});
     await p.save();
     await MentorFeedItem.updateOne(
        { trigger:{ type:'analysis', refId:p._id }},
        { 'status.todoState':'answered', answeredInteraction:newInteraction._id, completedAt:new Date() }
     );
  }
});
```

`isResolved` = check shared keywords & sentiment ≥ 0.

---

# EXAMPLES (updated)

| User Action                                                 | `user_interactions`                                                 | `interaction_analyses`                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Slider mood 2**                                           | `{kind:'compass', promptText:'Mood', numericAnswer:2}`              | *(none – we ignore numeric-only)*                                |
| **Fragment** “Stuck on project deadline …”                  | `{kind:'fragment', responseText:'Stuck…'}`                          | `intent:'problem', problem.needsFollowUp:true`                   |
| **Goal card answer** “Ship MVP by Oct” (mentorFeedId=`aaa`) | `{kind:'goal', mentorFeedId:'aaa', responseText:'Ship MVP by Oct'}` | `intent:'goal_definition'`                                       |
| **Follow-up**: “Submitted draft—feels good!”                | `{kind:'fragment', responseText:'Submitted draft…'}`                | Worker matches words, marks earlier problem.resolvedBy = this id |

---

# TASK CHECKLIST (updated fields)

### Phase 0

* [ ] Implement `user_interactions` (no `promptId`, **has `mentorFeedId`**).
* [ ] POST & GET routes with Zod.
* [ ] Smoke tests.

### Phase 1

* [ ] `compass_view`, `wins_view` worker (now inspect `promptText` or `captureMethod`).
* [ ] Seed **mentor\_feed\_items**.
* [ ] Front-end sets `mentorFeedId` when submitting answers from feed cards.

### Phase 2

* [ ] Build `interaction_analyses` as above.
* [ ] Worker generates follow-up cards *without* promptId—just `promptText` & `todoKind`.
* [ ] Resolution detector updates feed card via `answeredInteraction`.

---

## Out-of-Scope (future)

* `embeddings` table
* Pattern detection / macro trends
* AI-generated narrative profile

---

**Hand-off:** This spec is now fully aligned—no `promptId` anywhere, all joins key off `mentorFeedId` (for feed-triggered answers) or just the raw text (for autonomous entries). Backend & frontend teams can start implementation without hidden coupling.
