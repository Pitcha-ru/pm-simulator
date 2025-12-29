# Technical Specification: Web Mini-Game “Project Manager Task Board”

## 1) Goal & Concept
Build a browser mini-game where the player acts as a Project Manager (PM) and must **drag task cards** into the **correct department** before the task timer expires.

The UI is a **light, YouTrack-like task board**:
- **Top header**: author avatar + name + chat bubble (task comment) and a scoreboard (Score + Level)
- **Center**: task card(s) spawn
- **Bottom dock**: department blocks (drop zones)

All game content and balancing must be **editable without a new release** by storing JSON + icons in **Supabase Storage** and loading them at runtime. The game is deployed as a static web page on **Cloudflare**.

---

## 2) Hosting & Runtime Content (Cloudflare + Supabase)

### 2.1 Cloudflare hosting
- The game is a **single web page (SPA)** deployed on **Cloudflare Pages** (recommended) or an equivalent Cloudflare static hosting setup.
- No backend is required for gameplay.

### 2.2 Supabase Storage as the source of truth (no-redeploy updates)
All these files must live in Supabase Storage and be fetched by the app at runtime:
- `departments.json`
- `config.json`
- `task_authors.json`
- `priority_comments.json`
- all icons in:
  - `dep-icons/` (department icons)
  - `priority-icons/` (priority icons)
  - `authors-icons/` (author avatars)

**Requirement:** Editing any of the above in Supabase must change the game behavior/content **without redeploying Cloudflare**.

### 2.3 Access model
- Supabase Storage bucket should be readable from the client:
  - Either **Public bucket** OR **Signed URLs**.
- If Signed URLs are used, a lightweight Cloudflare Worker can mint signed URLs; otherwise prefer public read for simplicity (no sensitive content stored).

### 2.4 Client configuration (env)
The Cloudflare build must be configured via environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_BUCKET` (e.g., `pm-sim-assets`)
- `SUPABASE_BASE_PATH` (e.g., `game/`)

### 2.5 Caching & refresh
- On page load, the client fetches the latest JSON from Supabase.
- Use HTTP caching (ETag/Cache-Control) where possible.
- Optional: a “Refresh content” dev button (hidden behind a query param like `?debug=1`) to re-fetch JSON.

---

## 3) Data Files (Actual Schemas & Meanings)

> The sections below are aligned to the provided JSON structures.

### 3.1 `departments.json`
Contains:
- `meta.departmentsTotal` and `meta.departmentsActive`
- `departments[]`: each department has:
  - `id` (string)
  - `name` (string)
  - `active` (boolean)
  - `iconFile` (string filename of department icon)
  - `tasks` (array of task titles, strings)

**Important interpretation for gameplay:**
- A “task” is a **string title**.
- A task’s target department is defined by the department object that contains that string in `tasks[]`.

### 3.2 `config.json`
Key parameters:
- Max levels: `levels.maxLevels = 30`
- Departments active count progression:
  - `departments.startActive = 4`
  - growth mode: `linearStep`, `addCount = 1`, `everyLevels = 2`, `capToMax = true`
  - `maxActiveFromDepartmentsJson = true`, fallback max = 12
- Timers:
  - Base timer for “regular” tasks: `timers.regular.baseSeconds = 18`
  - Per-level scaling: exponential, `multiplierEachLevel = 0.95`, `minSeconds = 6`
  - Priority time multipliers:
    - regular 1.0
    - serious 0.85
    - critical 0.70
- Scoring:
  - `scoring.basePoints = 100`
  - Priority score multipliers:
    - regular 1.0
    - serious 1.35
    - critical 1.90
  - Time bonus: enabled, linear; `maxBonus=60`; full bonus if finished in first 25% of time
  - Streak: enabled; `maxMultiplier=1.5`; `+0.05` per success; reset on fail
- Priority chance model:
  - mode `curves` with “serious” and “critical” ease-in curves by level
  - regular is derived: `regular = 1 - serious - critical`
  - constraints: clamp, ensure sum=1, renormalize if regular < 0
- Validation:
  - `minSecondsFloor = 1`
  - `clampDepartmentsActive = true`

### 3.3 `task_authors.json`
Contains:
- `author[]`: list of authors with `id`, `name`, `avatar` filename

**Important interpretation for gameplay:**
- There is **no task→author mapping** in the provided schema.
- Therefore: author is chosen **randomly per spawned task** from `author[]`.

### 3.4 `priority_comments.json`
Contains:
- `priority_commentary` with keys:
  - `regular`, `serious`, `critical`
- Each priority has:
  - `icon` filename (for priority icon)
  - `title`
  - `messages[]` list of possible bubble comments

---

## 4) Visual Layout (UI/UX)

### 4.1 Overall screen zones
1) **Top Header (fixed)**
   - Left / Center: **Author Event Panel**
     - Round avatar (from `authors-icons/<avatar>`)
     - Author name
     - Speech bubble with one random message matching the task’s priority (`priority_comments.json`)
   - Right: **Scoreboard**
     - “Score: <value>”
     - “Level: <value>”
     - Minimal, compact styling

2) **Center Board Area**
   - Light board background, subtle grid/lines, YouTrack-like feel.
   - The active **Task Card** appears centered (MVP = one card at a time).
   - Card contains:
     - Task title (string from `departments.json`)
     - Priority icon (from `priority-icons/<icon>`, where icon filename comes from `priority_comments.json`)
     - Timer bar (decreasing progress)

3) **Bottom Departments Dock (fixed)**
   - Horizontal row (or responsive wrap) of department blocks.
   - Each block:
     - Department icon (from `dep-icons/<iconFile>`)
     - Department name
   - Blocks act as **drop targets**.

### 4.2 Interaction states
- Task card:
  - idle, dragging (cursor “grabbing”), success (fade/slide), fail (shake), timeout (fade out)
- Department blocks:
  - hover highlight
  - active drop highlight while card is over it
  - optional success flash on correct drop

---

## 5) Core Gameplay Loop

### 5.1 Task spawn
When a new task is created:
1) Determine **active departments set** (see §6.1).
2) Choose a department from active set (weighted or uniform; MVP = uniform).
3) Choose a task title string from that department’s `tasks[]` uniformly at random.
4) Determine priority according to `config.taskSpawn.priorityChances` (see §6.2).
5) Choose a random author from `task_authors.json.author[]`.
6) Display in header:
   - author avatar + name
   - bubble comment: random from `priority_comments.json.priority_commentary[priority].messages[]`
7) Spawn the task card in the center with its timer.

### 5.2 Player action
Player must **drag the card** and drop it onto the **correct department block** before time runs out.

Correct department = the department that the task was selected from (since tasks are stored inside department objects in `departments.json`).

### 5.3 Outcomes
- **Correct drop**
  - Task completes
  - Score increases (see §7)
  - Streak increases (if enabled)
  - Spawn next task (immediately or after a short delay, e.g., 300–600ms)
- **Wrong drop**
  - Task returns to center (do not reset timer)
  - Streak resets if `resetOnFail = true`
  - Optional small penalty (if desired; not specified in current config—see note below)
- **Timeout**
  - Task is missed
  - Streak resets
  - Optional penalty (same note)

**Note about penalties:** the provided `config.json` defines scoring for success (base + multipliers + time bonus + streak), but does not define explicit wrong/timeout penalties. Therefore:
- MVP: **no negative points**, only loss of opportunity and streak reset.
- Optional extension: add penalties later via config (new fields) without changing the deployed app.

---

## 6) Game Logic Details (must match current config)

### 6.1 Active departments count per level
Start with `departments.startActive = 4`.

Growth model is `linearStep`:
- Every `everyLevels = 2` levels, increase active department count by `addCount = 1`.

If `maxActiveFromDepartmentsJson = true`, max active departments = number of `departments[]` with `active: true` (or `meta.departmentsActive`) from `departments.json`.
If that cannot be derived, use `fallbackMaxActive = 12`.

If `capToMax = true`, clamp activeCount to max.
If `validation.clampDepartmentsActive = true`, always clamp even in edge cases.

**Result:** as level increases, more departments appear in the bottom dock (or become enabled).

### 6.2 Priority selection by level (curves)
Priorities are exactly: `regular`, `serious`, `critical`.

At a given level `L`, compute:
- `p_serious = easeInCurve(L, seriousCurveConfig)`
- `p_critical = easeInCurve(L, criticalCurveConfig)`
- `p_regular = 1 - p_serious - p_critical`

Apply constraints:
- Clamp each probability to `[0, 1]` and ensure sum = 1.
- If `p_regular` becomes negative: renormalize serious/critical and set regular=0.

Then sample priority from this distribution.

**easeIn curve definition (implementation requirement):**
- Use the provided parameters: `startAtLevel`, `endAtLevel`, `startValue`, `endValue`, `exponent`.
- Suggested formula:
  - `t = clamp((L - startAtLevel) / (endAtLevel - startAtLevel), 0..1)`
  - `value = startValue + (endValue - startValue) * (t ^ exponent)`

### 6.3 Timer duration per task (level scaling + priority multipliers)
Base seconds for regular tasks:
- `base = timers.regular.baseSeconds = 18`

Per-level scaling is exponential:
- `scaled = max(minSeconds, base * (multiplierEachLevel ^ (L - 1)))`
  - `multiplierEachLevel = 0.95`
  - `minSeconds = 6`
- Enforce `validation.minSecondsFloor = 1` as a final safeguard.

Apply priority time multiplier:
- `finalSeconds = scaled * timers.priorityTimeMultipliers[priority]`

### 6.4 Level progression (since config only defines maxLevels)
Because config does not define points-per-level, define a deterministic rule:
- Level increases when the player completes **N tasks** (recommended N=8), until `levels.maxLevels`.
- Store `tasksCompletedThisLevel` in state.

> This keeps progression stable while still letting balancing live mostly in `config.json`. If desired later, add `leveling` fields to config and read them dynamically.

---

## 7) Scoring (must match current config)

### 7.1 Base points & priority multiplier
For a successful completion:
- `base = scoring.basePoints = 100`
- `priorityMult = scoring.priorityScoreMultipliers[priority]`
- `points = base * priorityMult`

### 7.2 Time bonus (linear)
If `scoring.timeBonus.enabled = true`
- `maxBonus = 60`
- Full bonus if finished within the first `25%` of time: `bonusIfFinishedInFirstPercent = 0.25`
- Bonus decreases linearly to `0` at `bonusFallsToZeroAtPercent = 1.0` (i.e., at timeout).

Suggested formula:
- `progress = elapsed / total` (0..1)
- if `progress <= 0.25`: `timeBonus = 60`
- else if `progress >= 1.0`: `timeBonus = 0`
- else:
  - `timeBonus = 60 * (1 - (progress - 0.25) / (1.0 - 0.25))`

### 7.3 Streak multiplier
If `scoring.streak.enabled = true`
- Start `streakMult = 1.0`
- On each success: `streakMult += gainPerSuccess (0.05)` up to `maxMultiplier (1.5)`
- On wrong drop or timeout: reset to 1.0 if `resetOnFail = true`

Final awarded points:
- `awarded = (points + timeBonus) * streakMult`
- Round to integer (nearest or floor; choose one and keep consistent).

---

## 8) Drag & Drop Rules

### 8.1 Drop validation
- On drop, determine `targetDepartmentId` from the drop zone.
- A task is correct if `targetDepartmentId === task.departmentId` (department chosen at spawn).

### 8.2 Hit area / usability
- Department blocks must have large hit boxes (minimum height ~80px on desktop).
- While dragging, highlight the department under cursor.

---

## 9) State Machine (MVP)

### 9.1 States
- `INIT`: load runtime content from Supabase (JSON + resolve icon URLs)
- `RUNNING`: gameplay active
- `ERROR`: show an error screen if configs cannot be loaded

### 9.2 Error handling requirements
If a JSON file is missing/invalid:
- Show a centered error panel with:
  - which file failed (`departments.json`, etc.)
  - error reason (network / parsing)
- Provide a “Retry” button.

If an icon is missing:
- Use a fallback placeholder icon (generic image or initial letters).

---

## 10) Content Resolution (Supabase paths)
The app must resolve these assets dynamically:
- Department icon URL: `dep-icons/<iconFile>`
- Priority icon URL: `priority-icons/<priority_commentary[priority].icon>`
- Author avatar URL: `authors-icons/<author.avatar>`

---

## 11) Non-functional requirements
- Desktop-first, responsive layout.
- Smooth drag interactions (aim for 60 FPS).
- Deterministic logic: priority chance and timer scaling must follow config formulas.
- Clean architecture: separate modules for:
  - Supabase loading
  - game state (pure logic)
  - UI rendering
  - utilities (clamp, curve functions)

---

## 12) Acceptance Criteria (Definition of Done)

### 12.1 Runtime content updates (critical)
- Changing **departments**, **task titles**, **authors**, **priority texts/icons**, or **config balancing** in Supabase changes the live game **without a Cloudflare redeploy**.

### 12.2 Correct parsing & usage of current schemas
- Departments are read from `departments.json` with fields `id/name/active/iconFile/tasks[]`.
- Authors are read from `task_authors.json.author[]` and selected randomly.
- Priorities are exactly `regular/serious/critical`, with icons + messages from `priority_comments.json`.
- Timer scaling and scoring follow `config.json` formulas and multipliers.

### 12.3 Gameplay
- Task card spawns in center with title, priority icon, timer bar.
- Top header shows the author avatar + name + bubble message corresponding to the task priority.
- Player can drag task to a department:
  - Correct drop completes task and awards points.
  - Wrong drop returns card and resets streak (MVP).
  - Timeout removes card and resets streak.
- Score and Level are always visible.

### 12.4 Deployment
- App is deployed and accessible as a single page on Cloudflare.
- Supabase credentials are injected via Cloudflare environment variables.

---

## 13) Recommended future extension (optional, still “no redeploy”)
Add new config fields (in `config.json`) for:
- wrong drop penalty / timeout penalty
- level-up rule (points per level or tasks per level)
- multi-card mode (max simultaneous tasks)

The app should be built to ignore unknown fields safely, enabling gradual config evolution.
