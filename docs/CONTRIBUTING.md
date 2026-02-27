# Contributing to TIX-DAO

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

Thank you for your interest in TIX-DAO. This is an open-source project targeting the Solana Graveyard Hackathon 2026. Contributions that improve the governance UI, add real on-chain integration, improve documentation, or fix bugs are welcome.

---

## 1. Code of Conduct

We keep this simple:

- Be respectful. Critique code, not people.
- Be constructive. "This is broken" without context is not helpful. "This breaks because X, here's a fix" is.
- Be patient. Contributors work on this in their own time.
- Harassment of any kind will result in immediate removal from the project.

---

## 2. Getting Started

### Fork and Clone
```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/tix-dao.git
cd tix-dao
```

### Install Dependencies
```bash
# --legacy-peer-deps is required due to React 19 / wallet adapter peer dep conflict
npm install --legacy-peer-deps
```

### Set Up Environment
```bash
cp .env.local.example .env.local
# Defaults work for devnet development — no changes needed
```

### Run Locally
```bash
npm run dev
# App available at http://localhost:3000
```

### Verify Everything Works
```bash
npm run build   # TypeScript compile check + Next.js production build
npm run lint    # ESLint check
```

Both commands must pass before submitting a pull request.

---

## 3. Branch Strategy

| Branch | Purpose | Protected |
|---|---|---|
| `main` | Production-ready code. Deploys to Vercel on push. | ✅ Yes |
| `develop` | Integration branch. All features merge here first. | No |
| `feature/*` | New features. Branch from `develop`. | No |
| `fix/*` | Bug fixes. Branch from `develop` (or `main` for hotfixes). | No |
| `docs/*` | Documentation updates only. | No |
| `chore/*` | Dependency updates, config changes, tooling. | No |

### Workflow
```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/real-create-realm

# Work on your feature...

# Push and open a PR into develop
git push origin feature/real-create-realm
```

Do not open PRs directly against `main` unless it is an urgent hotfix that has been discussed in an issue first.

---

## 4. Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature or new user-facing behavior |
| `fix` | Bug fix |
| `docs` | Documentation only (README, docs/, code comments) |
| `style` | Formatting, missing semicolons — no logic change |
| `refactor` | Code change that is not a fix or feature |
| `chore` | Dependency updates, config changes, build scripts |
| `test` | Adding or updating tests |
| `perf` | Performance improvements |

### Examples
```
feat(proposals): add real castVote transaction via SPL-Governance
fix(wallet): silence WalletNotReadyError on autoConnect race
docs(architecture): add ve$TICK escrow account diagram
chore(deps): bump @solana/spl-governance to 0.3.29
refactor(create): extract TermField into shared component
```

Commits with unclear messages will be asked to reword during PR review.

---

## 5. Pull Request Process

### Before You Open a PR

- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm run lint` passes
- [ ] You have tested your changes manually at http://localhost:3000
- [ ] If adding on-chain calls: you have tested against Solana devnet with a real wallet

### PR Description Template

When you open a PR, use this template in the description:

```markdown
## What does this PR do?
<!-- One sentence summary -->

## Why?
<!-- Link to issue, or explain the motivation -->

## How was it tested?
<!-- Manual steps, devnet transaction signatures, etc. -->

## Screenshots (if UI change)
<!-- Before / After -->

## Checklist
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] No hardcoded wallet addresses or private keys
- [ ] All new async functions have try/catch
- [ ] No `any` types introduced
- [ ] Environment variables used for all config values
```

### Review Expectations

- PRs will receive a review within 48 hours during the hackathon period.
- One approving review is required to merge to `develop`.
- Two approving reviews are required to merge to `main`.
- Reviewers may request changes. Address all requested changes or explain why you disagree — do not silently re-request review without responding.

---

## 6. Development Guidelines

These rules are non-negotiable for all code merged into `main`.

### TypeScript — No `any`
```typescript
// ❌ Never do this
const handleVote = async (data: any) => { ... }

// ✅ Type everything explicitly
const handleVote = async (proposal: ProposalV2, choice: 'yes' | 'no') => { ... }
```
Enable `"strict": true` in `tsconfig.json` is already set. The CI build will fail on type errors.

### Wallet Interactions — Always Handle Errors
```typescript
// ❌ Never do this
const sig = await wallet.sendTransaction(tx, connection);

// ✅ Always wrap wallet calls
try {
  const sig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(sig);
} catch (err) {
  if (err instanceof WalletSignTransactionError) {
    // User rejected — silent or user-facing message, never crash
    return;
  }
  console.error('Transaction failed:', err);
  // Show user-facing error state
}
```

### Async Functions — Always Try/Catch
Every `async` function that calls external services (RPC, wallet, APIs) must have a `try/catch`. Uncaught promise rejections crash the app for all users in the session.

### No Hardcoded Addresses
```typescript
// ❌ Never hardcode
const PROGRAM_ID = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');

// ✅ Always use env vars
import { GOVERNANCE_PROGRAM_ID } from '@/lib/governance';
// src/lib/governance.ts reads from process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID
```

### Styling — Inline Styles Only (Current Pattern)
The project currently uses inline `style={{}}` props for all component styling (a deliberate terminal-aesthetic design system decision). When contributing:
- Keep new components consistent with the existing style approach
- Use the CSS variables defined in `globals.css` (e.g., `var(--border)`) via `style={{}}` when possible
- Do not introduce Tailwind utility classes in new components unless the component is purely structural

### Component Size
If a component file exceeds 200 lines, consider splitting it. `proposals/page.tsx` is at the upper limit — the `VoteBtn` and `BlockBar` sub-components are already extracted as an example of the right pattern.

---

## 7. Testing

TIX-DAO does not currently have a test runner. The primary quality gate is TypeScript compilation:

```bash
npm run build
```

This runs `next build` which:
1. Type-checks all TypeScript files via `tsc`
2. Compiles and bundles all pages
3. Fails loudly on any type error, missing import, or broken module

A passing build is a prerequisite for every PR.

**If you are adding on-chain functionality (Phase 2+):**
- Test against Solana devnet, not mainnet
- Include the devnet transaction signature in your PR description as proof of a successful on-chain interaction
- Confirm the transaction via [Solana Explorer on devnet](https://explorer.solana.com/?cluster=devnet)

---

## 8. Reporting Issues

Use GitHub Issues for bug reports, feature requests, and questions.

### Bug Report Template

```markdown
**Describe the bug**
A clear, one-sentence description of what is wrong.

**Steps to reproduce**
1. Go to '...'
2. Click '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened. Include the full error message and browser console output.

**Environment**
- Browser: Chrome 123 / Firefox 124 / Safari 17
- OS: macOS 14 / Windows 11 / Ubuntu 24
- Wallet: Phantom 24.x / Solflare 1.x
- Node version: 20.x
- npm version: 10.x

**Screenshots**
If applicable.

**Additional context**
Any other context about the problem.
```

### Security Vulnerabilities
Do **not** open a public GitHub issue for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for the responsible disclosure process.

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
