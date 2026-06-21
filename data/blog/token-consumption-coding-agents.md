---
title: 'How to write code using fewer tokens with coding agents'
date: '2026-06-21'
tags: ['AI', 'coding-agents', 'tokens', 'optimization', 'github-copilot', 'LLM', 'cost']
draft: false
summary: 'Coding agents run in autonomous loops that compound token costs in ways classic chat never does. This article breaks down how tokens accumulate, why agent mode is expensive by default, and four practical strategies to cut your bill significantly: prompt caching, planning first, output compression with the Caveman skill, and input compression with RTK.'
---

# Introduction

When developers first start using coding agents such as GitHub Copilot Agent Mode, Cursor, Claude Code, or [Cline](https://github.com/cline/cline), the token bill can come as a surprise. A task that looks like a simple one-liner prompt can quietly consume hundreds of thousands of tokens in the background. Understanding why this happens is the first step toward doing something about it.

This article covers:

- How tokens are counted and why agent mode is fundamentally different from classic chat
- The two most expensive failure modes: the feedback death loop and the context snowball effect
- Why planning first is the single most impactful optimization
- Two open-source tools — the [Caveman skill](https://github.com/JuliusBrussee/caveman) and [RTK](https://github.com/rtk-ai/rtk) — that compress output and input tokens respectively

# Classic chat vs. agent mode

The architectural difference between a standard AI chat and an agent is the root cause of most token waste.

**Classic chat** works as a single transaction. You send a prompt with context, the model replies, and the exchange is over. The total cost is straightforward:

```
Total = Context + Prompt + Completion
```

If you attach a 10,000-token file and write a 1,000-token prompt, you pay for roughly 11,000 input tokens plus whatever the model writes back.

**Agent mode** works differently. It operates in an autonomous [ReAct](https://arxiv.org/abs/2210.03629) loop: reason about the task, take an action (read a file, run a command, call a tool), observe the result, then reason again. The model is stateless — it does not remember previous steps. This means every loop iteration must resend the full context: the original task, all previous reasoning steps, every tool call result, and every terminal log accumulated so far.

```
Total = Sum(Context + History + Log_i) for each loop iteration
```

A ten-step agent run does not cost 10× one prompt. It costs the sum of ten progressively larger prompts because each iteration includes everything that came before it. A simple agent run that reads a few files and runs tests can easily hit 150,000 tokens for what started as an 11,000-token task.

## Context inflation in numbers

| Loop             | Content                   | Tokens       |
| ---------------- | ------------------------- | ------------ |
| 1                | Initial context + task    | 11,000       |
| 2                | Loop 1 + step 1 tool logs | 12,000       |
| 3                | Loop 2 + step 2 tool logs | 13,500       |
| ...              | ...                       | ...          |
| 10               | Full history + all logs   | 20,000       |
| **Total billed** |                           | **~155,000** |

The numbers compound because LLMs are stateless. There is no shared memory between calls — you pay to re-read everything on every turn.

# GitHub Copilot base overhead

Before your task even adds a single file, GitHub Copilot injects a fixed system payload into every request. This is not optional — it carries the rules, workspace indexes, and mode-specific instructions.

| Mode       | Base Token Cost |
| ---------- | --------------- |
| Ask Mode   | ~13,000 tokens  |
| Agent Mode | ~18,000 tokens  |

Agent mode adds approximately 5,000 tokens of planner instructions and tool schemas on top of the Ask Mode baseline. When you connect custom [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers, each one injects its own tool schema definitions into the system prompt.

```
Coding Agent base:        18,000 tokens
Custom MCPs & extensions: +0 to 10,000+ tokens
─────────────────────────────────────────────
Total starting cost:      18,000 to 28,000+ tokens
```

This overhead is incurred on every single loop iteration before any of your code is read.

## On-demand skills over persistent MCP servers

A lighter alternative to persistent MCP server schemas is to define agent skills as on-demand shell commands. Instead of loading a heavy tool schema into every prompt, the skill only runs when explicitly invoked. This bypasses the constant token overhead of always-loaded MCP tool definitions.

For example, a slash command that fetches PR comments, proposes a fix, and posts a reply adds zero tokens to your base prompt until you actually call it:

```bash
$ /gh-answer-pr-comments 2137

➜ Step 1: Reading PR Comments
  Found comment on src/auth.js #L34: "Can we optimize this search to O(1)?"

➜ Step 2: Proposing Code Improvements
  Replacing Array.find() with Map lookup.
  Diff proposed: + const tokenMap = new Map(tokens.map(t => [t.id, t]));

➜ Step 3: Replying to Comment
  Posted: "Refactored the linear search to a Map lookup for O(1) performance."

✔ Analysis complete. All comments resolved.
```

# Prompt caching: the 90% discount

All three major providers — Anthropic, OpenAI, and Google — offer prompt caching that applies a consistent ~90% discount to input tokens that hit the cache.

| Provider  | Model              | Input / 1M | Cached Input / 1M | Output / 1M |
| --------- | ------------------ | ---------- | ----------------- | ----------- |
| Anthropic | Claude Sonnet 4.6  | $3.00      | **$0.30**         | $15.00      |
| Anthropic | Claude Haiku 4.5   | $1.00      | **$0.10**         | $5.00       |
| OpenAI    | GPT-5.4 (Standard) | $2.50      | **$0.25**         | $15.00      |
| OpenAI    | GPT-5.4 Mini       | $0.75      | **$0.075**        | $4.50       |
| Google    | Gemini 3.5 Flash   | $1.50      | **$0.15**         | $9.00       |

For an autonomous agent running against a 100,000-token context (codebase map, open files, logs) using Claude Sonnet 4.6:

- **Without caching**: Every turn re-bills the full 100k context at $3.00/1M = **$0.30 per turn**
- **With caching**: The 100k prefix is cached. You pay only for the tiny delta = **$0.03 per turn**

That is a 90% reduction per agent turn. For a ten-step agent run, the difference is $3.00 vs. $0.30 for input costs alone.

## Cache TTL and avoiding cache busts

Caches use a sliding 5-to-10 minute TTL window. An active agent session maintains the cache between turns. An idle session will expire, forcing a full-price re-warm on the next request.

Three common ways to accidentally bust the cache:

1. **Prefix ordering mismatch**: Caches match from the start of the prompt. Static content like system instructions and files must come first. Dynamic inputs such as timestamps and user queries must come last. Reversing this order invalidates the cache on every request.
2. **Below-threshold size**: Anthropic requires a minimum of 1,024 tokens for caching to activate. Very short prompts are never cached.
3. **Non-deterministic structure**: Shuffling the order of tool output keys, log lines, or file listings between requests breaks the prefix match. Keep output structures deterministic.

# The two most expensive failure modes

When an agent jumps directly into writing code without a prior plan, it tends to fall into one or both of these patterns.

## Feedback death loop

The agent writes code → the compiler or test runner throws errors → the agent attempts a blind fix → the fix breaks an adjacent module → new errors appear → the agent attempts another blind fix. Without a high-level plan to anchor the agent's decisions, it can cycle through this loop indefinitely.

```
1. Write Code  →  2. Build Error  →  3. Blind Fix Attempt  →  4. Break Module  →  (back to 1)
```

Each iteration is billed as a separate LLM call. Each call includes all previous calls in its history.

## Context snowball effect

Every iteration appends to the prompt history:

| Turn | Content                       | Tokens  |
| ---- | ----------------------------- | ------- |
| 1    | Initial prompt + files        | 12,000  |
| 2    | Turn 1 + compile error        | 22,000  |
| 3    | Turn 2 + error logs + retries | 35,000+ |

Because LLM calls are stateless, every retry includes the entire previous conversation. Developers pay progressively more per turn, and the cost grows super-linearly with the number of iterations.

# Plan first, code second

The single most effective token-saving strategy is to agree on a text plan before letting the agent touch any code.

## Why text planning is cheap

A text description of a solution is dramatically smaller than actual code. Fixing a logical error in a plan costs one sentence. Fixing the same error after it has been compiled, tested, and iterated on costs tens of thousands of tokens. The planning overhead is a one-time cost; the error-fixing loop is unbounded.

## The planning paradox

Planning is not automatically free. If the agent reads 50,000 tokens of code just to draft a plan, the planning phase itself becomes expensive. The solution is token-optimized planning:

- Provide only **file signatures** and **export contracts** during the planning phase, not full implementations
- Use a **summary index** of the repository structure rather than reading every file
- Break the work into **isolated steps** so each implementation turn reads only the files relevant to that step

## Planned vs. spontaneous: the numbers

Consider a typical mid-size feature requiring four or five files:

**Spontaneous coding** (code on the fly):

- 1 direct code prompt
- 4+ compiler error loops
- Context grows with every error

**Total: ~400,000 tokens**

**Planned coding** (plan → implement):

- 1 planning prompt (with signatures only)
- 2–3 prompts clarifying requirements
- 1–3 prompts refining the plan
- 1 targeted execution step with isolated context

**Total: ~200,000 tokens**

The planned approach saves roughly **50%** by eliminating feedback loops and keeping context small during each implementation step.

## Context isolation

A plan lets you divide the task. Instead of letting the agent explore the whole codebase, the plan tells it exactly which file is needed for each step. An agent executing step one only needs to read `auth.js`. It does not need to read `database.js`, `routes.js`, or `middleware.js`.

```
❌ Unplanned: Agent searches aimlessly, reads 8 unrelated files
✅ Planned:   Step 1 reads only auth.js, step 2 reads only database.js
```

# Tool: Caveman skill (output compression)

Output tokens are less discussed than input tokens, but they still matter. A verbose explanation is slower to generate and contributes to the history size of subsequent turns.

The [Caveman skill](https://github.com/JuliusBrussee/caveman) is an open-source instruction set for Claude and compatible models that forces terse, fragment-style responses without sacrificing technical accuracy. A March 2026 paper on brevity constraints found that forcing LLMs to respond concisely improved accuracy by up to 26 points on standard benchmarks — shorter answers are not just cheaper, they can be more precise.

## Comparison

**Normal Claude** response to "why do I have so many rerenders?":

```
"The reason your React component is re-rendering is likely because you're creating
a new object reference on each render cycle. When you pass an inline object as a prop,
React's shallow comparison sees it as a different object every time, which triggers a
re-render. I'd recommend using useMemo to memoize the object."
```

**69 tokens**

**Caveman Claude** response to the same question:

```
"New object ref each render. Inline object prop = new ref = re-render. Wrap in useMemo."
```

**19 tokens**

Same solution. 72% fewer tokens. Faster response.

## Benchmark results

Real output token counts from the Claude API show an average of 65% output reduction across standard development tasks:

| Task                        | Normal | Caveman | Saved |
| --------------------------- | ------ | ------- | ----- |
| Explain React re-render bug | 1,180  | 159     | -87%  |
| Fix auth middleware expiry  | 704    | 121     | -83%  |
| Set up PostgreSQL pool      | 2,347  | 380     | -84%  |
| Explain git rebase vs merge | 702    | 292     | -58%  |
| Docker multi-stage build    | 1,042  | 290     | -72%  |

## Triggering the skill

Activate it in a chat session with a slash command:

```
dev:   /caveman full, why i have so many rerenders
agent: "New object ref each render. Inline object prop = new ref = re-render. Wrap in useMemo."
```

# Tool: RTK — Rust Token Killer (input compression)

Terminal output is one of the most wasteful inputs an agent consumes. Test runners print thousands of lines of passing tests when the agent only needs to know about failures. File reads include full function bodies when the agent only needs to locate a function signature.

[RTK](https://github.com/rtk-ai/rtk) is an open-source CLI proxy that intercepts terminal commands and compresses their output before it reaches the agent. It operates as a shell hook — the agent never knows RTK is there.

## Setup

A single line in your shell profile activates RTK for every subsequent command:

```bash
# ~/.zshrc or ~/.bashrc
eval "$(rtk hook init)"
```

From that point forward, when the agent runs `pytest -v`, the shell hook transparently rewrites it to `rtk pytest -v`. The command still runs; only the output returned to the agent is compressed.

## How the interception works

```
1. Agent triggers:   pytest -v
                         ↓  (shell hook intercepts)
2. Hook rewrites:    rtk pytest -v
                         ↓
3. RTK compresses output before returning it to the agent
```

The agent receives only failures and summary statistics. Thousands of passing-test lines never enter the context window.

## File signature compression

When exploring module structure, RTK strips function bodies and returns signatures only:

**Raw `auth.js` read:**

```js
import { db } from './db.js'

export async function login(user, pass) {
  const u = await db.getUser(user)
  if (!u || u.password !== pass) {
    throw new Error('Invalid login')
  }
  return generateToken(u)
}

export function verify(token) {
  if (!token) return false
  try {
    const payload = jwt.verify(token)
    return payload.expiry > Date.now()
  } catch {
    return false
  }
}
```

**RTK `read auth.js` output:**

```js
// auth.js (Structural outline)
import { db } from './db.js'

export async function login(user, pass) {
  /* body stripped */
}
export function verify(token) {
  /* body stripped */
}
```

Raw read: 4,200 tokens → RTK output: 210 tokens. **95% reduction.**

## Git diff compression

RTK collapses unchanged code blocks and strips git index metadata, leaving only the modified lines:

**Raw `git diff`:**

```diff
diff --git a/src/auth.js b/src/auth.js
index 45adcf2..2ba9c4b 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -12,5 +12,5 @@
 export function verify(token) {
-    const payload = jwt.verify(token);
+    const payload = jwt.verify(token, process.env.SECRET);
     return payload.expiry > Date.now();
 }
```

**RTK `git diff` output:**

```diff
diff --git a/src/auth.js b/src/auth.js
-    const payload = jwt.verify(token);
+    const payload = jwt.verify(token, process.env.SECRET);

[x412 lines of unmodified code collapsed]
```

Raw diff: 8,400 tokens → RTK output: 504 tokens. **94% reduction.**

## Benchmark results

Benchmarked across 2,900+ real-world developer commands with an average of **89% noise reduction**:

| Command                   | Token Reduction |
| ------------------------- | --------------- |
| `pytest -v` (Python)      | -96.0%          |
| `rtk read` (File Reading) | -95.0%          |
| `git diff`                | -94.0%          |
| `cargo test` (Rust)       | -91.8%          |
| `git log`                 | -86.0%          |

# Summary

Token costs with coding agents are a structural problem, not a prompt quality problem. The agent loop accumulates context with every iteration, and common failure modes can send that context spiraling into hundreds of thousands of tokens for tasks that should take tens of thousands.

The four practical countermeasures:

| Strategy           | What it addresses                   | Typical saving            |
| ------------------ | ----------------------------------- | ------------------------- |
| **Prompt caching** | Repeated input context per turn     | ~90% off cached tokens    |
| **Planning first** | Feedback loops and context snowball | ~50% off total tokens     |
| **Caveman skill**  | Verbose model output                | ~65–75% off output tokens |
| **RTK**            | Terminal and file read noise        | ~89% off input tokens     |

Use lightweight on-demand skills instead of persistent MCP servers to keep the base prompt lean. Validate designs as text blueprints before writing a single line of code — text is cheap to fix, compiled code is not.
