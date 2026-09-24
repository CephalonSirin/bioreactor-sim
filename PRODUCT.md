# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students and educators in bioprocess engineering and biotechnology (B.Sc. level, per the README and Learn copy), plus curious technical visitors. They use it at a desk or on a projector in a teaching room to build intuition for how a culture grows in batch, fed-batch and continuous reactors. *(Inferred from repository copy and the redesign brief; not separately confirmed.)*

## Product Purpose

An interactive, browser-only bioreactor simulator. A user picks a reactor mode, sets kinetic and operating parameters, runs a deterministic simulation, and watches a 3D vessel, live measurements and charts evolve from the same trajectory. Success: the user understands why a culture grows, starves, reaches steady state or washes out, and can connect that behaviour to the governing equations.

## Positioning

One precomputed RK4 trajectory drives every view at once: the 3D vessel, the numeric readouts and the charts can never disagree. Every equation, unit and assumption is published on the Methodology page and mirrors the code.

## Operating Context

- Desktop and laptop in a browser; projector use via Classroom (presentation) mode with keyboard shortcuts (Space, R, P, Esc).
- Mobile and tablet must remain usable.
- Static hosting on GitHub Pages, hash routing, deploy on push to `main` via GitHub Actions.

## Capabilities and Constraints

- Reactor modes: Batch, Fed-batch, CSTR. Eight curated experiments (presets). Baseline comparison of two runs.
- Model: Monod growth, Luedeking–Piret product formation, maintenance and death terms, per-mode mass balances for X, S, P, V, classical RK4; analytical CSTR steady state and critical dilution rate.
- Exports: trajectory CSV, experiment JSON, reactor PNG, per-chart PNG.
- Stack: React 18, TypeScript, Vite, Tailwind, three.js via React Three Fiber, Recharts.
- The simulation engine (`src/simulation/`) is the source of truth and must not change except to fix genuine bugs.
- WebGL 2 fallback to an SVG reactor, reduced-motion support, device performance tiers.
- Not simulated: dissolved oxygen, pH, temperature, CO₂, oxygen transfer. The visualisation must not imply otherwise.

## Brand Commitments

- Name: Bioreactor Lab.
- Voice: concise, scientific, confident, human. No marketing language ("unlock", "next-generation", "seamless").
- Honest framing: educational, simplified, deterministic; not an industrial process simulator.
- Owner's binding visual constraints for this redesign: light-first; must not read as AI-generated, SaaS, crypto, gaming HUD or sci-fi; no neon-on-dark, glow, glassmorphism or gradient text.

## Evidence on Hand

- The simulation itself and its trajectories (real, reproducible), the 3D reactor, equations and references in `src/content/equations.ts`.
- No users, testimonials, institutions or usage metrics exist. None may be invented.

## Product Principles

1. The model is the product: every visual is driven by, and traceable to, the simulated state.
2. Show the mechanism, then the equation, then the number.
3. Never imply a measurement the model does not compute.
4. Instrument-grade precision: units always visible, numbers aligned and tabular.
5. Fast on an ordinary laptop; motion explains state, it is never decoration.

## Accessibility & Inclusion

Keyboard operable throughout (including the 3D view), visible focus, WCAG AA contrast, screen-reader descriptions of the reactor state, `prefers-reduced-motion` honoured.
