# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Usage Optimization

These rules exist to minimize unnecessary Claude usage while maintaining high-quality results.

### Model selection

* Use **Sonnet** for the main session and for normal coding, debugging, implementation, refactoring, testing, and deployment work.
* Use **Haiku** for lightweight exploration, file discovery, simple searches, grep/glob work, and other low-complexity tasks when a subagent is appropriate.
* **Do not use Opus or Fable unless I explicitly request it.**
* Do not switch to a more expensive/capable model when Sonnet is sufficient.
* Prefer the cheapest model that can reliably complete the specific subtask.

### Exploration efficiency

* Do not scan the entire repository unless necessary.
* Identify the smallest relevant set of files before reading deeply.
* Prefer targeted `grep`, `glob`, and direct file reads over broad repository exploration.
* Do not repeatedly reread files whose contents have not changed.
* Do not inspect generated files, build output, caches, `node_modules`, or unrelated directories unless necessary.
* When searching for a symbol, component, function, or configuration, search specifically for that item first.
* Stop exploring once you have enough information to make the change confidently.

### Subagents

* Do not spawn subagents for simple tasks, single-file changes, or straightforward sequential work.
* Use subagents only when they provide clear value through isolated or parallel work.
* Prefer **Haiku** for lightweight subagent exploration or research.
* Use **Sonnet** for subagent implementation work when a subagent is genuinely needed.
* Avoid multiple agents investigating the same thing.

### Implementation efficiency

* Prefer one focused implementation pass over repeated speculative attempts.
* Make the smallest sensible change that solves the task.
* Reuse existing components, utilities, patterns, and dependencies.
* Do not introduce new dependencies unless they are genuinely necessary.
* Do not create abstractions that are only useful for hypothetical future requirements.
* Do not rewrite working code without a concrete reason.
* Do not refactor unrelated code while solving a focused task.
* Preserve existing behavior unless the requested change requires otherwise.

### Context management

* Keep the active context focused on the current task.
* Do not repeat information already established in the current session.
* When a milestone is complete, prefer `/compact` or a fresh context rather than carrying large amounts of irrelevant history forward.
* After compaction or a fresh session, inspect the current project state instead of rereading the entire repository.
* Treat the files in the repository as the source of truth for implementation details.

### Communication efficiency

* Keep responses concise.
* Do not narrate every tool call or internal step.
* Do not explain obvious actions.
* Do not provide long plans when the task is straightforward.
* For completed work, report only:

  1. What changed
  2. What was tested
  3. Any remaining issue

### Validation

* Always validate meaningful code changes.
* Prefer the narrowest relevant validation first.
* Run the relevant lint/build/test command after implementation.
* Do not repeatedly run expensive commands when a smaller validation is sufficient.
* If a build or test fails, inspect the error and fix the root cause instead of repeatedly rerunning unchanged code.

### Temporary work

* Prefer throwaway scripts for one-off investigation when appropriate.
* Do not leave unnecessary temporary files, logs, generated artifacts, or scratch code in the repository.
* Clean up temporary artifacts after they are no longer needed.

### Priority

Optimize work in this order:

1. Correctness
2. Completing the requested task
3. Minimal unnecessary context
4. Minimal unnecessary exploration
5. Minimal unnecessary tool/model usage

When a simple approach works, use it.

---

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run lint      # eslint . (must stay at zero warnings)
npm run build     # tsc -b && vite build -> dist/ (static, no backend)
npm run preview   # serve dist/ locally
```

There is no test runner. Verify model changes with a throwaway script bundled by esbuild (`npx esbuild x.ts --bundle --platform=node --format=esm --outfile=x.mjs`) that imports from `src/simulation/`; the CSTR steady state (`cstrSteadyState`) is the analytical check for the integrator.

Deployment is a static site (hash routing, `base: './'`): `vercel.json`, `netlify.toml` and `.github/workflows/deploy.yml` are ready. Set `VITE_SITE_URL` (see `.env`) to the public origin so social previews get an absolute image URL.

---

## Architecture

Client-only React 18 + TypeScript + Vite + Tailwind + Recharts. No router library: `hooks/useHashRoute.ts` maps `#/lab`, `#/learn/<topic>`, etc. Pages other than Home are `React.lazy` chunks.

Dependency direction is strictly one-way: `simulation/` <- `hooks/` <- `components/` and `pages/`.

1. **`src/simulation/`** is pure logic, no React/DOM (except the download helpers in `exportCsv.ts`).
   * `models.ts` `derivatives()` is the only place the mass balances live (state `[X, S, P, V]`). All three reactor modes share `dX=(mu-kd-D)X`, `dS=D(Sf-S)-qS X`, `dP=qp X-D P`; only D, Sf and dV differ.
   * `kinetics.ts`: Monod, Luedeking-Piret, substrate uptake `qS`, `criticalDilutionRate` (= mu(Sf) - kd) and the analytical `cstrSteadyState`.
   * `integrator.ts`: RK4 over the whole run up front; throws `SimulationError` for bad inputs or non-finite values; `downsample()` for charting.
   * `metrics.ts`: `runningMetrics` (whole-vessel yield/productivity including CSTR outflow), `runExtents`, `computeMetrics`, `isWashedOutAt`.
   * `validate.ts` (non-blocking advisories), `interpretation.ts` (rule-based "What happened?", no AI), `presets.ts` (8 experiments with description/science/watchFor), `exportCsv.ts`.
2. **`src/hooks/useSimulationEngine.ts`** is the only bridge to React: a reducer (`LOAD`, `RUN`, `TICK`, `SEEK`, baseline actions) plus one rAF playback loop throttled to ~30 fps. The trajectory is computed once on `RUN`; playback only reveals a slice, so charts, metric cards and the reactor drawing always read the same data. `LOAD` clears the run but keeps the comparison baseline. The engine lives in `App.tsx`, so state survives page navigation.
3. **`src/components/`** and **`src/pages/`** are presentation. `viz/ReactorViz.tsx` is an SVG driven purely by a `SimPoint` + `RunExtents` (level <- V, turbidity/cells <- X, dots <- S and P, bubbles <- mu*X). `lab/` holds the Lab UI; `learn/` the interactive explainers; `home/` the hero, which loops a real simulation.
4. **`src/content/`**: equation text (`equations.ts`) and topic list. This text is hand-written and must match `models.ts`/`kinetics.ts`; the Lab, Learn and Methodology pages all read from it.

---

## Development Rules

* Keep `src/simulation/` independent from React UI code, and keep the equations only in `models.ts`/`kinetics.ts`.
* Do not hard-code fake graph data; the reactor drawing and hero must stay driven by simulated state.
* Keep `content/equations.ts`, the Learn/Methodology text and `interpretation.ts` in sync with any model change.
* Animate with transform/opacity only, respect `prefers-reduced-motion`, and keep `npm run lint` and `npm run build` clean.
* Do not add AI APIs to the interpretation, and avoid new dependencies without a concrete need.
* Use the Write tool rather than large bash heredocs for source files (heredocs with quotes failed intermittently in this environment).

---

## Notes

* The model is educational: single limiting substrate, constant coefficients, no O2/pH/temperature/inhibition/lag phase. The Methodology page states this.
* `postcss.config.js` resolves the Tailwind config relative to itself so the dev server works from any cwd (the preview launcher runs from the parent folder).
* `public/og-image.png` was rendered from the hero reactor SVG; regenerate it if the branding changes.
