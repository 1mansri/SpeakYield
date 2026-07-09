# DESIGN TOOLING — installed plugins & where they belong

> **Status:** Draft, prototype-stage. Written 2026-07-09. Companion to [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md).
> Documents the design/animation plugins installed via `/plugin install`, and — more importantly — draws a hard line on where each one is and isn't appropriate for **this** product.

---

## 1. The constraint that governs everything below

The core app is a **voice-first tool for low-literacy farmers on low-end Android phones over 2G/3G** ([REQUIREMENTS.md NFR](../docs/01-product/REQUIREMENTS.md#3-non-functional-requirements): "usable on 2G/3G"), with a deliberately **minimal, low-text** design ([PROTOTYPE_DESIGN.md §1](./PROTOTYPE_DESIGN.md#1-design-principles)). A 3D WebGL scene or scroll-driven animation sequence costs bundle size, GPU/battery, and load time that a farmer on a ₹6,000 phone with a patchy signal cannot afford — for a UI whose entire job is "one big mic button, one thing at a time." Fancy motion is not just unnecessary here, it actively works against the product's core promise.

So: **the six core app screens get restrained micro-interactions only. Anything heavier is landing-page-only territory** (see §3).

## 2. Installed tooling — what each one is

| Plugin | What it does |
|---|---|
| `threejs-webgl` | Low-level 3D/WebGL scene rendering. |
| `react-three-fiber` | React renderer for Three.js — declarative 3D in React components. |
| `core-3d-animation` / `extended-3d-scroll` | 3D animation and scroll-driven 3D sequences. |
| `gsap-scrolltrigger` | GSAP's scroll-position-driven animation triggers. |
| `animation-components` / `authoring-motion` | Reusable motion/animation component patterns. |
| `meta-skills` | Skill-authoring/meta tooling (not UI-facing). |
| `ux-ui-mastery` | General UX/UI design heuristics and review guidance. |

## 3. Where each one belongs

### In the core app (the 6 screens in [PROTOTYPE_DESIGN.md §5](./PROTOTYPE_DESIGN.md#5-pages)) — restrained use only

| Use case | Tool | Guardrail |
|---|---|---|
| Listening-screen waveform | Lightweight canvas/CSS, GSAP for easing if needed | Must run smoothly on a low-end phone CPU — no WebGL for this. |
| Screen-to-screen transitions (Home → Listening → Confirm, etc.) | GSAP (simple fade/slide, no ScrollTrigger — there's no scrolling) | ≤200ms, respects `prefers-reduced-motion`, no layout jank. |
| Button/tap feedback (mic press, Confirm) | `animation-components` micro-interactions | Instant, subtle — confirms the tap registered, nothing decorative. |
| Status stepper (Order Status screen) | Simple CSS transition between steps | No animation library needed at all. |

**Explicitly not in the core app:** `threejs-webgl`, `react-three-fiber`, `core-3d-animation`, `extended-3d-scroll`, `gsap-scrolltrigger` (ScrollTrigger specifically — the app has no scrolling marketing content, it's single-screen-at-a-time). Adding these to the farmer-facing flow would violate the "minimal, low-bandwidth, low-literacy" constraints this whole doc set is built around — don't reach for them here even if it looks impressive in isolation.

### Outside the core app — where the heavy tooling actually fits

If/when a **separate investor/pitch landing page** gets built (not part of the 1-week prototype scope in [PROTOTYPE.md](./PROTOTYPE.md) — a future, explicitly separate mini-project), that's where `threejs-webgl`, `react-three-fiber`, `gsap-scrolltrigger`, and the 3D animation plugins are genuinely the right tool: a marketing page has no low-bandwidth farmer-on-a-basic-phone constraint, benefits from a strong visual hook, and is scrolled rather than tapped through. **Do not build this during the current 1-week prototype sprint** — it's out of scope per [PROTOTYPE.md §3](./PROTOTYPE.md#3-scope) and would eat into the time budgeted for the actual voice pipeline.

### `ux-ui-mastery`

General-purpose — use it during [PHASES.md Phase 12](./PHASES.md#phase-12--polish-responsiveness-tests-demo-readiness) (the polish/responsiveness pass) to review the six built screens against standard UX heuristics (tap target sizing, contrast, feedback states, error recovery) — a good independent check against [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md)'s own principles before the demo.

## 4. Performance budget reminder

Any animation added to the core app should be checked against the same bar as everything else in [REQUIREMENTS.md](../docs/01-product/REQUIREMENTS.md): usable on 2G/3G, on a low-end device, for a low-literacy user who needs the UI to feel instant and obvious — not impressive. If a motion effect makes the app feel slower or more complicated, cut it, regardless of how good the plugin is.
