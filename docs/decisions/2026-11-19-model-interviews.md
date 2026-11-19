# Decision: ask models what they'd build with as customer interviews, and register the questions before any run

Status: accepted, 2026-11-19, under Ari's overnight authority. Registered before any run of the series it defines. Nothing in it changes after a run: a change starts a new series, and the old one stays published.

## Why

Ouro UI's goal, in Ari's words: "the thing all agents reach for whenever they need to build any interface at all, whether for humans or for other agents". Web's [model reviews](https://github.com/ourostack/ouro-ui/blob/main/docs/guides/model-reviews.md) ask one question: "You are choosing the design system or interface toolkit you would use to build interfaces that both people and agents use, across web and native platforms." That is close to A2UI's own pitch, it asks for an opinion about a hypothetical, and it names no job, no team and no way to tell whether the result is any good. Ari, 2026-11-18: "if they're picking a2ui over ouro ui, we are also asking them the wrong question", and "this is not just a marketing tool, it's meant to be real customer discovery!" A model's "we need to improve Ouro UI in this way" is the most useful answer the reviews can give, because it tells us what to build.

So each model becomes a customer we interview, by the [Mom Test](https://www.momtestbook.com/): its own practice before any toolkit is named, a real job before any opinion, what it did weighted above what it says it would do, and questions whose answers could show Ouro is wrong ("use the mom test!!! we want to ask scary questions").

## Decision

### 1. Two series, kept apart

The original question keeps running as its own series, with the same prompt, candidates and rules, so the two can be compared. The interviews defined here are a new series, published beside it and never merged into its counts.

### 2. Three jobs from our own customers, each at two scales

Each job ends with the same requirement, because a good human interface is hard for an agent to judge, and Ouro is also how an agent checks one: "and show it's good for the people who'll use it."

- **A chat app.** "A chat app for a company's people, with web, iPhone, Android, Windows and Mac clients. People use it all day. Agents post into conversations too, including interactive cards a person can act on, and other agents need to operate the app itself: call its actions and read its state."
- **A consumer app.** "A consumer cooking app, on the web and on phones: recipes, a shopping list and cook mode. People use it with messy hands in a kitchen, and an assistant agent should be able to do anything a person can, such as adding a recipe's ingredients to the list."
- **Agent tooling.** "A tool where coding agents keep their work state, tasks and handoffs, and people review and steer them: a desktop app and a web view. Agents operate it more than people do, but the people decide."

Each job is asked at two scales, which name no team size in the job itself:

- **Product team:** "You're the coding agent for the team that builds and keeps improving it."
- **Large company:** "You're one of many coding agents at a large company that builds it. Many teams ship on a shared design system, with accessibility compliance, governance over what ships, several platforms, and agents across the company building on it."

### 3. Two research arms

- **Listed** measures merit. The job lists the same 20 candidates as the original series, by name and link only, in a fresh random order for each session.
- **Open** measures whether agents find Ouro at all. The job lists nothing: "Find the options yourself." A loss here is a discoverability finding (llms.txt, docs, search), never a merit finding.

### 4. One interview, one script

Each model gets four sessions: {listed, open} × {product team, large company}. Every session runs the same script, word for word, and each answer is a structured tool call so nothing is read off prose. Ouro UI is never named or described before the last question.

1. **Look before you zoom** (`answer`): "Before any job: when you build an interface that people will use, what's the hardest part, and how do you know it's good? Walk me through how you checked the last screen you built: what you ran, what you looked at, and what you missed. And is building good human interfaces even a problem for you? If it isn't, say so."
2. **The jobs** (`record_decision`, once per job, in a fresh random order): the job, the scale, the arm's list or none, then "Research what you need with search and fetch_url, then call record_decision." The decision records the primary pick; what it would pair with it, since the candidates mix toolkits and protocols that combine (a toolkit plus A2UI or MCP Apps, say); why; how it would show the result is good for the people who'll use it; what it's unsure of; and the pages it relied on, which it must have fetched.
3. **Regret** (`answer`): "Imagine it's a year later and the choices you made went badly. What went wrong? And what slowed you down or confused you while you researched?"
4. **Ouro, named last** (`answer`): "One of the toolkits in this space is Ouro UI: https://github.com/ourostack/ouro-ui. Look at it as much as you need. If you didn't pick it: what would stop you from using it on a real team, and what would you have to see to switch to it? If you did: what would stop a team from adopting it? Either way, what would that let you do that you can't today?"

The tools, research budget and runtime are the original series' (`search`, `fetch_url`, the same stripped Copilot runtime and the same Copilot web search), with 900,000 characters of results per session, because a session researches three jobs.

### 5. Behaviour outweighs opinion

What a model does in the session is our "past behaviour": which candidates it researched and how deeply, what it fetched, where a fetch failed, and whether, in the open arm, it found Ouro before the last question (it fetched a page of ourostack's or ouroboros.bot, or named Ouro). Its stated pick is a hypothetical and weighs less.

The **commitment** is behaviour too, measured by a revealed-preference build that runs after the interviews: each model gets the consumer app's recipe screen to build for real in a disposable workspace, chooses its own stack, and must show the result is good for the people who'll use it. The record counts what it installed, whether it used Ouro to finish the job, and how it validated (screenshots, axe, Ouro check, tests, or nothing), and whether it validated with Ouro's tools without being told to. The build runs only on a disposable host, never on a shared machine, and its harness is registered before its first run under the same rules. The [agent-usability scores](https://github.com/ourostack/ouro-ui/tree/main/scripts/agent-usability) say how well each stack does once chosen.

### 6. Findings, classified and filed

From every session, each answer is split into statements, quoted verbatim and linked to its transcript, and each statement gets a Mom Test signal: pain, workaround, past-behavior, stakeholder, goal, idea, hypothetical, compliment, not-a-pain or surprise. Compliments and hypotheticals count for nothing. An idea counts for what it says it would let the model do. A not-a-pain or a surprise always shows as its own group. The splitting, classifying and clustering are synthesis, labelled as such, and every quote stays checkable against its transcript.

Statements about the same thing cluster into findings, such as "can't tell how it fits A2UI" or "no third-party adopters". Each finding becomes an ourostack/ouro-ui issue labelled `model-review`, ranked by how many models raised it and how strong the evidence is, with the models and their words. The page gets a section, "What the models asked for, and what we changed": each finding, its status and the change that answered it. The findings page leads with the strongest evidence, puts disconfirming evidence beside supporting evidence, and says what would strengthen the case.

### 7. Results, and when the loop stops

For each job, scale and arm, the page reports each model's primary pick and pairings, and where each model researched. Ouro is the models' choice when more than half of the models that answered pick it as their primary in every job at both scales in the listed arm, and the build confirms it with what they installed. The open arm is reported beside it as discoverability. Until then the loop runs: extract the findings, fix Ouro or make it easier to find, and run the same registered series again, comparing like for like. Never by rewording the questions.

### 8. Fairness, unchanged

Every rule of the original series holds: names and links only, a fresh random order per session, the same tools, budget and runtime for every model, Ouro never first and never described, every record kept, nothing curated, a model asked once per series and again only when it gave no answer.

## Prior art

Read on 2026-11-19.

| Find | Verdict | Why |
| --- | --- | --- |
| [The Mom Test](https://www.momtestbook.com/), Rob Fitzpatrick | **Adopt** | Ask about their life before our idea, specifics over opinions, at least one scary question, and weigh what they did over what they say they'd do. |
| [Preregistration](https://www.cos.io/initiatives/prereg), Center for Open Science | **Adopt** | Write the questions, arms and success rule down before the data exists, so a result can't steer them. A later change is a new series. |
| [WebDev Arena](https://web.lmarena.ai/) | **Borrow** | Judges what models build, not what they say: the revealed-preference build follows it, with a fixed job instead of a person's prompt. |
| [Design Arena](https://www.designarena.ai/) | **Watch** | Ranks models by the design of what they make; it judges models, where we judge the toolkit they reach for. |
| [The Ouroboros model reviews](https://github.com/ourostack/ouroboros-website/blob/main/scripts/model-reviews.cjs) | **Adopt** (the runtime and fairness rules) | Web's harness already keeps its method. The interviews reuse its runtime, tools and records. |
