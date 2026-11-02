# Development notes: prompts, tests and what changed

A log of what was tried while building the agent and what each test led to.

## 1. Retrieval test before the agent existed
**Test:** `search_rules` run manually with *"how is combat damage assigned when a creature with trample and deathtouch is blocked"*, k = 5.
**Result:** Top 5 were the two Trample chunks (702.19), two trample-related rulings and rule 510.4. Deathtouch (702.2) was missing.
**Why:** The query is mostly trample vocabulary ("combat damage assigned", "blocked"), so trample chunks score highest.
**Change:** Instruction 3 added: call `search_rules` once per mechanic.

## 2. Local model via Ollama (qwen2.5:7b)
Agent Builder has no Ollama provider. Ollama exposes an OpenAI-compatible API, so the model was connected through the **OpenAI** provider with Base URL `http://host.docker.internal:11434/v1`. The model list loaded correctly.

**Test question:** *How does trample and deathtouch interact?*

**Attempt 1:** No tool calls. The answer was wrong (it claimed trample hits the player first and that deathtouch can kill a player) and had no sources.
**Cause:** Ollama's default context window (2048 tokens) is smaller than the instructions + tool definitions + n8n's own agent prompt. Ollama cuts the beginning of the prompt, so the model never saw the instructions or tools.
**Fix tried:** `OLLAMA_CONTEXT_LENGTH=16384` set as a Windows user environment variable, Ollama restarted.

**Attempt 2:** The model now called a tool, but the request failed with `input[2]: unknown input item type: "item_reference"`.
**Cause:** Agent Builder talks to the OpenAI provider through the Responses API and refers to earlier tool calls with `item_reference` items. Ollama's OpenAI compatibility layer does not support that item type, so every request after the first tool call is rejected.
**Decision:** Switch the agent's chat model to Claude Haiku 5.5. Embeddings and all retrieval still run locally.

## 3. Claude Haiku 5.5
Same question, new session: correct answer, both mechanics found with two separate `search_rules` calls, rule numbers cited. See [example_questions.md](example_questions.md), Q1.

**Observation:** The tool call list also shows `Anthropic.tool search` calls. This is Anthropic's built-in tool search, which n8n uses so the model can look up which tools exist. The agent described one of these as "a keyword search for deathtouch that returned nothing", which sounded like a data problem but was a search over the tool list. Lesson: verify the agent's description of its own tool use against the execution log.

## 4. Cost control
Claude API credits are prepaid ($5 bought, auto-reload off), so the project cannot spend more than that. A full test question with 2-4 tool calls costs a fraction of a cent on Haiku 5.5.

## Prompts used during development
- How does trample and deathtouch interact?
- Which green creatures with mana value 3 or less have trample in Foundations? How many are there?
- What does Black Lotus do, and is it legal in Standard?
