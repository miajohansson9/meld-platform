## MELD — Story-first Onboarding Spec

*v2.0 — integrates brand story ▶︎ hands-on loop ▶︎ mentor insight*
(voice & priorities as Fidji Simo would brief the squad)

---

### 0. North-Star Objectives

| KPI                                                    | Target                                                |
| ------------------------------------------------------ | ----------------------------------------------------- |
| **Time-to-First-Aha** (sign-up ▶︎ check-in saved)      | ≤ 3 min median                                        |
| **Day-0 Story Comprehension** (quiz prompt after tour) | ≥ 80 % can pick MELD’s “compass not calendar” tagline |
| **Mentor Insight CTA Click-through**                   | ≥ 50 % click *Reflect now* or *Schedule*              |

---

## 1. Route Map

| Order | URL                   | Layout                                  | Purpose                                                                            |
| ----- | --------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| 1     | `/welcome`            | **ImmersiveStoryLayout** *(no sidebar)* | 3-slide carousel telling “Who is MELD?” using existing screenshots as live embeds. |
| 2     | `/signup`             | **WizardLayout**                        | Basics + up to 8 “get to know you” Qs.                                             |
| 3     | `/today?tour=checkin` | **MainAppShell** + **GuidedOverlay**    | Daily Compass / Evening Reflection.                                                |
| 4     | `/today?tour=mentor`  | Same                                    | Mentor Feed pops Insight → user chooses *Reflect* or *Schedule*.                   |
| 5     | Normal app routes     | —                                       | User continues regular flow.                                                       |

---

## 2. Screen-by-Screen Detail

### 2.1 Immersive Story (3 slides, swipe or arrow)

| Slide       | Visual                                                     | Copy Snippet                                                                           |
| ----------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Mission** | Full-bleed North-Star Map screenshot, subtle sage overlay. | “MELD helps high-potential women turn **fragments** into a clear story and direction.” |
| **Method**  | Fragments screen + Wins Vault mini animation.              | “Capture fragments ➜ spot patterns ➜ celebrate wins.”                                  |
| **Promise** | Mentor Feed card zoom & Chat bubble.                       | “A strategic thinking partner at your side, not a productivity drill sergeant.”        |

CTA on last slide → **“I’m In — Let’s Start”** ➜ `/signup`.

---

### 2.2 Sign-up Wizard (unchanged except copy)


### MELD • Register Wizard

*High-level feature & flow brief — framed as I’d pitch it to the design team*

---

## 1. Intent

We turn the dull “sign-up form” into a **60-second conversation** that:

1. **Affirms our promise** (mentor, fragments, compass) before we ask anything useful.
2. **Collects just enough context** (7 questions max) to make the first mentor reply feel uncanny.
3. **Feels like progress** — every tap lights up the next dot, every screen is a bite.

---

## 2. Flow in Four Micro-Slides

*(Desktop layout: split card 1040 px — left 40 % story, right 60 % inputs. Mobile: story block first, inputs underneath.)*

| Slide                                | Progress Label | What the user sees                                                                                                                                                                                                      | Why it matters                                                                            |
| ------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **0 Welcome pulse**                  | —              | Dark gradient panel with compass glyph + line: **“Your strategic thinking partner awaits.”** CTA → **“Let’s begin”**                                                                                                    | Plants the mentor idea; mentally flips user from “form” to “conversation.”                |
| **1 · Getting to know you**          | **1 / 4**      | Inputs: **Name**, **Email**, **DOB** (“birthday helps us celebrate milestones”).                                                                                                                                        | Lightweight, familiar; progress bar animates to 25 %.                                     |
| **2 · Why you’re here**              | **2 / 4**      | Tile MCQ (goal / transition / idea / fresh start / unsure) → tap auto-advances; follow-up single-line: *“One thing you want to focus on.”*                                                                              | Gives immediate agency; left panel swaps screenshot that matches tile.                    |
| **3 · How should I sound?**          | **3 / 4**      | Multi-select chips: Encouraging · Strategic · Candid · Calming · Uplifting · Other.                                                                                                                                     | Lets user set tone; shows we’ll adapt.                                                    |
| **4 · Quick pulse check (optional)** | **4 / 4**      | Two stacked boxes:<br>• *“When do you feel most like yourself?”* (short answer)<br>• *“Fast-forward 6 months—where do you hope to be?”* (long answer, char counter) <br> Skip link bottom-left: “I’ll fill this later.” | Depth for those who want it, but entirely skippable; keeps time ≤ 60 s for everyone else. |

CTA on final slide = **“Start my Compass”** → routes directly into Today page with guided first check-in.

---

## 3. Visual & Motion Staples

* **Story Panel**

  * Rotating screenshots (Fragments → Wins Vault → Mentor Feed) fade every 4 s.
  * Headline stays constant: *“Capture. Map. Move.”*

* **Progress Bar** — 4 dots, 8 px radius.

  * Empty stroke `sage 30 %` → filled `ink` with a 250 ms radial wipe.

* **Card Motion**

  * Each slide uses **horizontal swipe**: card shifts +24 px + fades on exit; next card slides in from +24 px → 0.
  * Duration 220 ms ease-out; feels snappy, not showy.

* **Input Focus**

  * Underline swells from 2 px → 4 px `sage` on focus; drops back on blur.
  * Error text in `ember` but we hide it until blur (avoid shouting).

* **Primary buttons**

  * Charcoal background, canvas text; on hover darkens 8 %.
  * Disabled state 20 % opacity until all required fields valid.

---

## 4. Microcopy Cheatsheet

| Surface                      | Copy                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Tile prompt                  | **“What brought you here today?”**                                                                                           |
| Tile labels                  | **Setting a goal** / **Navigating a transition** / **Making sense of an idea** / **I want a fresh start** / **Not sure yet** |
| Focus line                   | “One thing you’re focused on right now …”                                                                                    |
| Tone prompt                  | “How should your mentor sound?”<br>*Choose 1 – 3 styles*                                                                     |
| Optional depth screen header | “Let’s go a layer deeper (totally optional)”                                                                                 |
| Skip link                    | “I’ll fill this later”                                                                                                       |
| Final button                 | **“Start my Compass”**                                                                                                       |

*Disclaimer under long answer:*

> “The more you share, the sharper your mentor can be.”

---

## 5. First-Check-In Hook (after Finish)

Immediately land on Today page with a floating coach bubble:

| If local time < 3 PM                                                                 | If ≥ 3 PM                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Bubble title: **“Daily Compass”**<br>Body: “Slide, type, breathe—today starts here.” | Bubble title: **“Evening Reflection”**<br>Body: “Log the win & lesson. Tomorrow will thank you.” |

Confetti & toast on **Complete**. Streak badge “1” lights up in sidebar.

---

## 6. Calendar Mention (soft)

We **don’t** ask for calendar yet; instead, in Story Panel slide 2 we plant a seed:

> “Soon, MELD will spot white-space in your calendar and suggest reflection blocks (only if you opt-in).”

Inside the portal, Mentor Feed will later surface a *“Link calendar for smarter nudges”* card.

---

## 7. Hand-Off Checklist for Design

1. **Figma Frames** – Four slides desktop + mobile, overlay bubble states, confetti burst.
2. **Component Variants** – Tile (default/selected), Chip (default/selected), Progress dots (empty/filled).
3. **Prototype** – Smart-animate between slides, morning vs evening bubble path.
4. **Accessibility notes** – All text ≥ AA contrast; keyboard focus ring 2 px `sage`.

---

### Fidji’s “North-Star” Reminder

> “This register flow is *not* bureaucracy—it’s the first proof that MELD listens. Make each screen human, keep it moving, and leave her with a tiny dopamine hit: ‘I already did my first check-in.’ That’s how you win day-one retention.”

---

### 2.3 Guided Overlay Step #1 — Check-in

Same rules as previous spec:

```ts
const isEvening = localHour >= 15;
firstStep = isEvening ? <EveningReflection/> : <DailyCompass/>;
```

Coach copy variants:

* Morning: “Set your compass for today.”
* Evening: “Wind down and log what mattered.”

Emit `tour_step_complete {step: "checkin"}` then redirect to `/today?tour=mentor`.

---

### 2.4 Guided Overlay Step #2 — Mentor Insight

**Trigger**: FE passes `tour=mentor` ➜ MentorFeed service injects *one-time* card:

```
type InsightCard = {
  id: "onboard-goal";
  type: "insight";
  title: "Let's map your bigger goals";
  body: "Daily check-ins are the heartbeat. Now let's sketch where you’re headed."
  actions: [
    { label:"Reflect now", variant:"primary", action:"openChatGoalPrompt" },
    { label:"Schedule for later", variant:"secondary", action:"openScheduleModal" }
  ]
}
```

* If *Reflect now*: open Chat tab with prefilled message “I want to clarify my biggest goal.”
* If *Schedule*: open modal asking permission to add 15-min “Goal Reflection” to calendar **tomorrow at 9 AM local** (adjust if past 20 PM).
* On action choose ➜ `tour_step_complete {step:"mentor", action:"reflect" | "schedule"}` ➜ set `first_run_complete = true`.

---

## 3. Component / Code Work

| Component                | Build / Re-use                      | Notes                                                                           |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------- |
| **ImmersiveStoryLayout** | **New**                             | Full-bleed flex carousel, pagination dots.                                      |
| **InsightCard**          | **Extend existing MentorFeed card** | Accept `actions[]` prop; primary button styles already in tokens.               |
| **GuidedOverlay**        | In previous spec.                   | Two flows: `"checkin"` then `"mentor"`. Overlay auto-dismiss after card action. |
| **ScheduleModal**        | **New** but simple.                 | Dropdown for time, Confirm ➜ `POST /api/calendar/event`.                        |

---

## 4. API Additions

```yaml
POST /api/mentor/insight/dismiss
{ insightId: "onboard-goal", action: "reflect" | "schedule" }

POST /api/calendar/event
{ title: "Goal Reflection", startsAt: "2025-07-04T09:00:00", durationMin: 15 }
```

---

## 5. Analytics

| Event                | Props                     |
| -------------------- | ------------------------- |
| `Story Slide Viewed` | idx, total, timeOnSlide   |
| `Insight Action`     | id="onboard-goal", action |
| `Calendar Granted`   | provider (gcal/ics)       |

Funnel dashboard slices by **Morning vs Evening** entry to test copy.

---

## 6. Edge-Cases

* If user refreshes during tour → read query param & `user_meta` to restore correct overlay.
* If MentorFeed already has 2+ unread insights, still pin **onboard-goal** to top until actioned.
* Tour suppressed for returning users (`first_run_complete` true).

---

## 7. Copy (final draft)

1. **Insight Button Labels**

   * Primary: “Reflect now”
   * Secondary: “Schedule, I’m busy”

2. **Schedule Modal**

   * Header: “Block 15 minutes to think big”
   * Body: “Great goals deserve calendar space. Choose a time.”

3. **Chat Prompt** (auto-sent if Reflect):

   > “I’d like help clarifying my biggest 6-month goal.”

---

## 8. Delivered When…

* Story slides responsive & AA contrast.
* 3-step tour works desktop + mobile.
* Insight card disappears after action.
* Google-calendar OAuth flow functional (fallback: download `.ics`).
* Amplitude events firing with <1 % error.
* E2E Cypress covers Morning path and Evening path.

---

> **Fidji final word:** The flow now **tells** her why MELD matters, then **lets her feel it** by doing a check-in, and finally **pulls her upward** with a mentor nudge. That’s the story, the habit loop, and the aspiration—all in the first session. Build tight, ship fast, measure relentlessly.
