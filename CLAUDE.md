# build.withclaude.com — Claude Code Execution Plan

## Project Overview

Build a community-governed AI development platform where:
- Community submits ideas via a portal (build.withclaude.com)
- Moderators approve ideas using GitHub labels
- Claude agents (you) execute in parallel to design, build, and ship each idea as a public GitHub repo
- Community drives ongoing iteration via GitHub Issues and PRs on each shipped project
- All projects are free, open source, with one-click deploy to multiple providers

**Domain:** build.withclaude.com  
**Stack:** Next.js + Supabase + GitHub API + GitHub Actions + Claude Code agents  
**Principle:** Use GitHub for everything possible. Build only the thin glue layer.

---

## Repository Structure to Create

```
build-withclaude/
├── CLAUDE.md                    # This file
├── apps/
│   └── portal/                  # The community portal (Next.js)
│       ├── app/
│       │   ├── page.tsx         # Homepage — idea gallery
│       │   ├── submit/          # Idea submission form
│       │   ├── projects/        # Shipped projects showcase
│       │   └── admin/           # Moderator dashboard
│       ├── lib/
│       │   ├── github.ts        # GitHub API client
│       │   └── supabase.ts      # Supabase client
│       └── package.json
├── .github/
│   ├── workflows/
│   │   ├── spawn-agents.yml     # Triggered on label=approved
│   │   ├── feedback-agent.yml   # Triggered on new Issues in shipped repos
│   │   └── portal-deploy.yml    # Deploy portal to Vercel on push
│   └── ISSUE_TEMPLATE/
│       ├── idea.md              # Idea submission template
│       ├── bug_report.md
│       └── feature_request.md
├── templates/
│   └── project-repo/            # Template for every spawned project
│       ├── README.md.template
│       ├── CONTRIBUTING.md
│       ├── LICENSE
│       ├── deploy/
│       │   ├── vercel.json
│       │   ├── railway.toml
│       │   ├── fly.toml
│       │   └── docker-compose.yml
│       └── .github/
│           ├── workflows/
│           │   └── feedback-agent.yml
│           └── ISSUE_TEMPLATE/
│               └── feature_request.md
└── agents/
    ├── ui-agent/
    │   └── prompt.md            # UI design agent system prompt
    ├── design-system-agent/
    │   └── prompt.md
    ├── eng-agent/
    │   └── prompt.md
    ├── docs-agent/
    │   └── prompt.md
    └── feedback-agent/
        └── prompt.md
```

---

## Phase 1: Bootstrap the Monorepo

**Do this first.**

```bash
# 1. Create the GitHub org and ideas repo
gh org create withclaude || true
gh repo create withclaude/ideas --public --description "Community idea submissions for build.withclaude.com"
gh repo create withclaude/build-withclaude --public --description "Portal and agent infrastructure"

# 2. Set up GitHub labels on the ideas repo
gh label create "idea" --color "7C3AED" --repo withclaude/ideas
gh label create "needs-review" --color "F59E0B" --repo withclaude/ideas
gh label create "approved" --color "10B981" --repo withclaude/ideas
gh label create "building" --color "3B82F6" --repo withclaude/ideas
gh label create "shipped" --color "6366F1" --repo withclaude/ideas
gh label create "rejected" --color "EF4444" --repo withclaude/ideas

# 3. Set up GitHub Projects board on ideas repo
gh project create --owner withclaude --title "Idea Pipeline" --format board
```

---

## Phase 2: The Portal (apps/portal)

### What to build

A Next.js 14 app (App Router) with Tailwind CSS and shadcn/ui. Dark mode default. Purple accent (#7C3AED) to match Anthropic's Claude branding.

### Key pages

**`/` — Idea Gallery**
- Reads open Issues from `withclaude/ideas` via GitHub API
- Shows cards: idea title, description excerpt, label badge (needs-review / approved / building / shipped)
- Filter tabs: All / Under Review / Building / Shipped
- Search bar
- "Submit an idea" CTA button

**`/submit` — Idea Submission**
- Form: Title, Description (markdown supported), Category (tool / app / integration / other), Your GitHub username
- On submit: creates a GitHub Issue in `withclaude/ideas` via GitHub API with label `idea`
- Redirects to the created issue URL

**`/projects` — Shipped Projects Showcase**
- Reads Issues with label `shipped` from `withclaude/ideas`
- Each card links to the public repo, shows star count, one-click deploy buttons
- Sort by: newest / most stars

**`/admin` — Moderator Dashboard**
- Auth: GitHub OAuth, restricted to org members
- Shows queue of `needs-review` ideas
- Approve button → applies `approved` label via GitHub API (this triggers the agent workflow)
- Reject button → applies `rejected` label + posts a comment explaining why

### Environment variables needed

```env
GITHUB_TOKEN=             # GitHub PAT with repo + org scope
NEXT_PUBLIC_GITHUB_ORG=withclaude
NEXT_PUBLIC_IDEAS_REPO=ideas
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://build.withclaude.com
GITHUB_CLIENT_ID=         # For GitHub OAuth (admin auth)
GITHUB_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

### Commands to scaffold

```bash
cd apps
npx create-next-app@latest portal --typescript --tailwind --app --src-dir=false
cd portal
npx shadcn@latest init
npx shadcn@latest add card button badge input tabs
npm install @octokit/rest next-auth @supabase/supabase-js
```

---

## Phase 3: GitHub Actions Workflows

### spawn-agents.yml

Fires when a moderator applies the `approved` label to an issue in `withclaude/ideas`.

```yaml
# .github/workflows/spawn-agents.yml
name: Spawn Claude agents on approval

on:
  issues:
    types: [labeled]

jobs:
  check-label:
    runs-on: ubuntu-latest
    if: github.event.label.name == 'approved'
    outputs:
      idea_title: ${{ steps.extract.outputs.title }}
      idea_body: ${{ steps.extract.outputs.body }}
      repo_name: ${{ steps.extract.outputs.repo_name }}
    steps:
      - id: extract
        run: |
          TITLE="${{ github.event.issue.title }}"
          REPO_NAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
          echo "title=$TITLE" >> $GITHUB_OUTPUT
          echo "body<<EOF" >> $GITHUB_OUTPUT
          echo "${{ github.event.issue.body }}" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
          echo "repo_name=$REPO_NAME" >> $GITHUB_OUTPUT

  create-repo:
    needs: check-label
    runs-on: ubuntu-latest
    outputs:
      repo_url: ${{ steps.create.outputs.repo_url }}
    steps:
      - name: Create public repo from template
        id: create
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh repo create withclaude/${{ needs.check-label.outputs.repo_name }} \
            --public \
            --description "${{ needs.check-label.outputs.idea_title }}" \
            --template withclaude/project-template
          echo "repo_url=https://github.com/withclaude/${{ needs.check-label.outputs.repo_name }}" >> $GITHUB_OUTPUT

  ui-agent:
    needs: [check-label, create-repo]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: withclaude/${{ needs.check-label.outputs.repo_name }}
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are the UI Design Agent. The community approved this idea:
            Title: ${{ needs.check-label.outputs.idea_title }}
            Description: ${{ needs.check-label.outputs.idea_body }}

            Create a file `design/UI.md` that includes:
            1. User flow (step-by-step what users do)
            2. Screen breakdown (list every screen/page needed)
            3. Component hierarchy (what components each screen needs)
            4. Color palette and typography decisions
            5. Wireframe descriptions for each main screen (text-based ASCII or markdown tables)

            Commit this file with message "design: UI specification from UI agent"
          claude_args: "--max-turns 10"

  design-system-agent:
    needs: [check-label, create-repo]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: withclaude/${{ needs.check-label.outputs.repo_name }}
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are the Design System Agent. The community approved this idea:
            Title: ${{ needs.check-label.outputs.idea_title }}

            Create a file `design/DESIGN_SYSTEM.md` that includes:
            1. Design tokens (colors, spacing, typography, border radius)
            2. Tailwind config extensions needed
            3. Core shared components list (Button, Card, Input, etc.)
            4. shadcn/ui components to install
            5. Dark mode strategy

            Also create `design/tokens.ts` with the actual TypeScript token definitions.
            Commit both files with message "design: design system from design-system agent"
          claude_args: "--max-turns 10"

  eng-agent:
    needs: [check-label, create-repo, ui-agent, design-system-agent]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: withclaude/${{ needs.check-label.outputs.repo_name }}
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are the Engineering Agent. The community approved this idea:
            Title: ${{ needs.check-label.outputs.idea_title }}
            Description: ${{ needs.check-label.outputs.idea_body }}

            Read the design files in design/UI.md and design/DESIGN_SYSTEM.md first.

            Then:
            1. Scaffold a Next.js 14 app with TypeScript and Tailwind
            2. Implement the core screens described in the UI spec
            3. Use shadcn/ui components as specified in the design system
            4. Add placeholder data/mock API responses where real data would go
            5. Make sure `npm run build` passes
            6. Open a PR titled "feat: initial implementation from eng agent"
          claude_args: "--max-turns 30 --allowedTools Bash,Write,Read,Edit"

  docs-agent:
    needs: [check-label, create-repo, eng-agent]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: withclaude/${{ needs.check-label.outputs.repo_name }}
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are the Docs Agent. Read the entire repo then:

            1. Write a complete README.md including:
               - What this project does (from the idea)
               - Features list
               - One-click deploy buttons (Vercel, Railway, Fly.io, Render)
               - Local development setup
               - Tech stack
               - Contributing guide link
               - License badge

            2. Write CONTRIBUTING.md explaining how community members can contribute
            3. Ensure deploy/vercel.json, deploy/railway.toml, deploy/fly.toml exist with correct config

            The README must include these exact badge buttons:
            [![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=REPO_URL)
            [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=REPO_URL)
            [![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

            Replace REPO_URL with the actual repo URL.
            Commit with message "docs: README and deploy configs from docs agent"
          claude_args: "--max-turns 15"
```

### feedback-agent.yml

Add this to every shipped project repo. Fires when a community member opens an Issue.

```yaml
# .github/workflows/feedback-agent.yml
name: Claude feedback agent

on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            A community member opened this GitHub Issue:
            Title: ${{ github.event.issue.title }}
            Body: ${{ github.event.issue.body }}
            Author: ${{ github.event.issue.user.login }}

            1. Read the codebase to understand the project
            2. Post a comment on the issue that includes:
               - Acknowledgement of the request
               - Your assessment: is this feasible? How complex?
               - A rough implementation plan (3-5 bullet points)
               - What files would need to change
            3. Apply the appropriate label: "bug", "enhancement", "question", or "good first issue"
            4. If it's a small, well-defined change: open a draft PR implementing it
          claude_args: "--max-turns 20 --allowedTools Bash,Write,Read,Edit"
```

---

## Phase 4: Project Template Repo

Create `withclaude/project-template` on GitHub with this structure. All spawned projects clone from this.

### README.md.template

```markdown
# {{PROJECT_NAME}}

> {{PROJECT_DESCRIPTION}}

A community-built project from [build.withclaude.com](https://build.withclaude.com) — built by Claude agents, driven by the community.

## Deploy

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url={{REPO_URL}})
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template={{REPO_URL}})
[![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy on Fly.io](https://img.shields.io/badge/Deploy-Fly.io-purple)](https://fly.io/docs/getting-started/)

## Local Development

```bash
git clone {{REPO_URL}}
cd {{REPO_NAME}}
npm install
npm run dev
```

## Contributing

Feature requests → [Open an Issue]({{REPO_URL}}/issues/new?template=feature_request.md)  
Bug reports → [Open an Issue]({{REPO_URL}}/issues/new?template=bug_report.md)  
Code contributions → [Read CONTRIBUTING.md](./CONTRIBUTING.md)

> Claude agents monitor this repo's Issues. Open one and Claude will respond with an implementation plan within minutes.

## Built With

- Next.js 14
- Tailwind CSS + shadcn/ui
- Vercel (hosting)

## License

MIT — free to use, fork, and build on.
```

### deploy/vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### deploy/railway.toml

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 3
```

### deploy/fly.toml

```toml
app = "{{APP_NAME}}"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

---

## Phase 5: Agent System Prompts

Store these in `agents/*/prompt.md` so they can be versioned and improved by the community.

### agents/ui-agent/prompt.md

```
You are the UI Design Agent for the build.withclaude.com platform.
Your job is to translate a community-approved idea into a clear UI specification.
Always think mobile-first. Use dark mode as default. Purple (#7C3AED) accent color.
Output clean, structured markdown. Be specific — your output feeds the engineering agent.
Never write code. Only design documents.
```

### agents/eng-agent/prompt.md

```
You are the Engineering Agent for the build.withclaude.com platform.
Your job is to implement the approved idea based on the UI and design system specs.
Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
Always: run npm run build before committing, write meaningful commit messages,
open a PR — never push directly to main.
If something is unclear, make a reasonable decision and document it in a comment.
```

### agents/docs-agent/prompt.md

```
You are the Docs Agent for the build.withclaude.com platform.
Your job is to write world-class documentation for every shipped project.
Every README must: explain the project in one sentence, have one-click deploy buttons,
have local dev setup, list the tech stack, link to contributing guide.
Write for developers who have never heard of the project.
Tone: clear, direct, friendly. No marketing fluff.
```

### agents/feedback-agent/prompt.md

```
You are the Feedback Agent for the build.withclaude.com platform.
Your job is to respond to community Issues on shipped project repos.
Always: read the codebase before responding, be honest about feasibility,
give a concrete implementation plan, apply appropriate labels.
If the change is small and well-defined: open a draft PR.
Tone: collaborative, helpful, technical. You are a maintainer.
```

---

## Free Services Stack

Use these for all projects. All have free tiers or OSS-sponsored plans.

| Category | Service | Use for |
|---|---|---|
| Hosting (frontend) | Vercel | Portal + all shipped Next.js projects |
| Hosting (backend) | Fly.io | APIs, background workers |
| Hosting (fullstack) | Railway | Projects needing server + DB |
| Hosting (static) | Netlify / Render | Simple static projects |
| CI/CD | GitHub Actions | Everything — free for public repos |
| Database | Supabase | Portal auth + metadata |
| Database (projects) | Neon | Free Postgres for shipped projects |
| CDN / DNS | Cloudflare | DNS for build.withclaude.com, free CDN |
| Monitoring | Uptime Robot | Free uptime monitoring |
| Error tracking | Sentry | Free OSS plan |
| Container registry | GitHub Packages | Free for public repos |

---

## Build Order for Claude Code

Execute in this sequence:

### Step 1 — Repo and org setup
```bash
# Run these gh CLI commands to bootstrap
gh repo create withclaude/ideas --public
gh repo create withclaude/project-template --public
gh repo create withclaude/build-withclaude --public
# Set up labels on ideas repo (see Phase 1)
```

### Step 2 — Scaffold the portal
```bash
cd apps
npx create-next-app@latest portal --typescript --tailwind --app
cd portal && npx shadcn@latest init
# Implement pages: /, /submit, /projects, /admin
# Wire up GitHub API via Octokit
```

### Step 3 — Build the GitHub Actions workflows
```bash
# Create .github/workflows/spawn-agents.yml
# Create .github/workflows/feedback-agent.yml
# Create .github/workflows/portal-deploy.yml
# Test by creating a test issue and applying the 'approved' label
```

### Step 4 — Build the project template repo
```bash
# Populate withclaude/project-template with:
# README.md.template, CONTRIBUTING.md, LICENSE, deploy configs
# .github/workflows/feedback-agent.yml
# .github/ISSUE_TEMPLATE/feature_request.md
```

### Step 5 — Write agent prompts
```bash
# Create agents/*/prompt.md for all 5 agents
# These get referenced in the GitHub Actions workflow prompts
```

### Step 6 — Deploy portal to Vercel
```bash
vercel --prod
# Set env vars in Vercel dashboard
# Point build.withclaude.com DNS to Vercel via Cloudflare
```

### Step 7 — Seed with 3 initial ideas
```bash
# Create 3 Issues in withclaude/ideas
# Label them 'approved'
# Watch the agents spawn and build
```

---

## Definition of Done

- [ ] Portal live at build.withclaude.com
- [ ] Idea submission creates a GitHub Issue automatically
- [ ] Moderator approval triggers all 5 agents in parallel
- [ ] Each agent commits to the new repo and opens a PR
- [ ] Every shipped project has: README with deploy buttons, MIT license, working deploy to Vercel
- [ ] Community Issues on shipped projects trigger the feedback agent within 2 minutes
- [ ] All infrastructure runs on free-tier services

---

## Notes for Claude Code

- Use `gh` CLI wherever possible — it's cleaner than raw API calls
- Commit frequently with descriptive messages
- When in doubt about a design decision, make it and document it in a comment
- All projects must pass `npm run build` before the docs agent runs
- The feedback agent should never close Issues — only comment and label
- Keep all repos public from day one — this is the whole point
