# Reverse-Engineered AI Security & Review Platforms

This repository contains **pixel-perfect, reverse-engineered replicas** of two leading AI developer platforms:
1. **[CodeAnt AI](https://codeant.ai/)** – The Exploit-Based Agentic Security Platform.
2. **[CodeRabbit AI](https://www.coderabbit.ai/)** – Governance & Control for Agentic Development.

---

## 🚀 Live Local Access

Both sites are hosted simultaneously through the unified local server:

| Platform | Live Local URL | Original Source | Tech Stack / Architecture |
|---|---|---|---|
| **CodeAnt AI** | **[http://localhost:3000/](http://localhost:3000/)** | [codeant.ai](https://codeant.ai/) | Framer SSR, Mona Sans, Geist Mono, Plus Jakarta Sans |
| **CodeRabbit AI** | **[http://localhost:3000/coderabbit/](http://localhost:3000/coderabbit/)** | [coderabbit.ai](https://www.coderabbit.ai/) | Next.js SSR, Tailwind CSS, Hack & Lato, Geist |

---

## ⚡ How to Run

### Option 1: Node.js (Recommended)
```bash
npm start
# or: node server.js
```

### Option 2: Python
```bash
python -m http.server 3000
```

---

## 🎨 CodeRabbit AI: Design System & Features

### Visual Tokens & Aesthetics
- **Dark Theme Palette**:
  - Background: `#0d0d0f` / `#121014`
  - Neutral Mauve / Dark Cards: `var(--color-cui-mauve-1)`
  - Brand Accent: `#ff5c00` / `#ff6a00` (CodeRabbit Orange)
  - Secondary Accents: `#25e2a8` (Mint Green badge), `#838bff` (Soft Purple)
  - Primary Action Button: `#ffffff` with hover `#e5e7eb` and micro-bounce active state
- **Typography**:
  - `Geist` & `Geist Fallback`
  - `Hack` monospace for code diffs and file headers
  - `Lato` for body text
- **Interactive Components**:
  - **Hero PR Reviewer**: 4 interactive workflow tabs (`01 Review`, `02 Prioritize`, `03 Understand`, `04 Secure`) with active indicators.
  - **Inline Code Review Diff**:
    - File header: `src/server/auth/permissions.ts`
    - Diff lines: `- await db.project.update(input)` / `+ await updateProjectAndInvalidate(input)`
    - Bot feedback & agent loop comments (OpenAI Codex vs CodeRabbit).
  - **Customer Proof Marquee**:
    - Logos: NVIDIA, Indeed, Adyen, JFrog, Gilead, BMW Group, Swiggy, Visma, Trivago, Bun, Clerk, Dialpad, TaskRabbit.
    - Verified quote from Jensen Huang (*Founder & CEO, NVIDIA*).
    - Metrics: `17K customers`, `6M Repositories`, `Most installed AI App on GitHub & GitLab`.
  - **Large Wireframe Footer**:
    - Glowing oversized vector contour watermark: `CodeRabbit`.
    - Newsletter signup form and legal directory.

---

## 🛡️ CodeAnt AI: Design System & Features

- **Dark Theme Palette**:
  - Background: `#000000` pitch black with ambient glow, vignetting, and ASCII matrix code grid.
  - Accent Color: `#6363f1` (Vibrant Indigo / Purple) with gradient text highlights.
- **Components**:
  - ASCII Matrix Hero with `[AI CODE REVIEW + SECURITY]` badge.
  - 3-Step 3D Wireframe flow (Orbital node sphere, Hyperboloid mesh, Isometric prism grid).
  - Defensive Code & Cloud CSPM dashboards with compliance circle charts (SOC 2, HIPAA, NIST, PCI DSS).
  - Integrations matrix and compliance seals.

---

## 📁 Repository Structure

```
├── index.html                   # CodeAnt AI standalone HTML
├── server.js                    # Multi-site Node.js server with caching & proxying
├── package.json                 # Project scripts (npm start, npm run dev)
├── coderabbit/
│   ├── index.html               # CodeRabbit AI standalone HTML
│   ├── css/                     # 5 downloaded Tailwind & layout CSS bundles
│   │   ├── 0v8gbaa9isyyc.css
│   │   ├── 2s7rzn8qh5vc4.css
│   │   ├── 2xyxb275253hr.css
│   │   ├── 34-251wianijv.css
│   │   └── 3zifdf-3n23jj.css
│   └── media/                   # Downloaded Hack, Geist, and Lato font files
├── README.md                    # Project documentation
```
