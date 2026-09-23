# Bioreactor Lab

An interactive teaching laboratory for bioprocess kinetics. Run batch, fed-batch and continuous (CSTR) bioreactors in the browser and watch an animated vessel, live metrics and charts respond to the same simulated state.

**Educational, simplified and deterministic.** Idealised mass balances, one limiting substrate. Not an industrial process simulator. The Methodology page lists every equation, unit and assumption.

## Features

- **Home**: animated home whose reactor plays a real simulation on a loop, mode overview, experiment teasers.
- **Bioreactor Lab**: reactor selector, parameter panel with validation, animated reactor, 8 live metric cards, playback (run, pause, resume, reset, 1–20× speed, scrubbable timeline), charts with series toggles / tooltips / PNG export, rule-based "What happened?" insights, and a comparison table.
- **Experiments**: 8 curated scenarios (Healthy Batch Growth, Substrate Limited, Fast Growth, High Feed Fed-Batch, Controlled Fed-Batch, Low Feed, Stable CSTR, CSTR Washout), each with the science explained and a real sparkline. Pick any two to overlay them in the Lab.
- **Learn**: ten concept-first topics with interactive explainers (Monod curve, Luedeking–Piret, yield, dilution rate, steady state vs washout).
- **Methodology**: equations with variables, units and physical meaning; numerical method; what each visual element encodes; assumptions and references.
- **Presentation mode** (button or `P`): larger reactor, numbers and charts for a projector; `Esc` exits. `Space` plays/pauses, `R` re-runs.
- **Export**: trajectory CSV, full experiment JSON (parameters + metrics + trajectory), reactor image, and per-chart PNGs, with descriptive filenames.

## The model

Monod growth `μ = μmax·S/(Ks+S)`, Luedeking–Piret product formation `qp = αμ + β`, substrate uptake `qS = μ/Yx/s + qp/Yp/s + ms`, and per-mode mass balances for biomass X, substrate S, product P and volume V, integrated with 4th-order Runge–Kutta. In a CSTR the critical dilution rate is `D_crit = μ(Sf) − kd`, and the analytical steady state is used as a check on the solver. Source of truth: `src/simulation/models.ts` and `kinetics.ts`.

## Develop

Requires Node 18+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build    # type-check + production bundle in dist/
npm run preview
```

## Deploy

It is a fully static site (hash routing, relative asset paths), so any static host works.

- **Vercel**: import the repo (or run `npx vercel`); `vercel.json` sets the build and cache headers.
- **Netlify**: import the repo, or drag the `dist/` folder onto <https://app.netlify.com/drop>; `netlify.toml` is included.
- **GitHub Pages**: push to a repo, enable Pages with source "GitHub Actions"; `.github/workflows/deploy.yml` builds and publishes on every push to `main`.

After you know the public URL, set `VITE_SITE_URL=https://your-site.example` (host environment variable, or in `.env`) and rebuild so the Open Graph / Twitter preview image URL is absolute.

## Structure

```
src/simulation/   pure model: kinetics, mass balances, RK4, metrics, presets, validation, export
src/hooks/        simulation engine (reducer + playback), hash router
src/components/   viz3d (WebGL reactor + HUD), viz (SVG fallback), lab, learn, home, layout, ui
src/pages/        Home, Learn, Experiments, Methodology (Lab lives in components/lab)
src/content/      equation text and topic lists shown across the site
```

## Architecture notes

- The simulation (`src/simulation/`) is pure TypeScript with no UI dependencies. A run is integrated once with RK4; playback only reveals a slice of that trajectory, so the charts, metric cards and reactor always show the same data.
- The 3D reactor (`src/components/viz3d/`) maps each simulated state to visual targets in `visualState.ts` (level from V, turbidity and cells from X, particles from S and P, gas from aeration plus μX, flows from F or D·V). The three.js scene is lazy-loaded and damps toward those targets every frame, so simulation updates never re-render the scene graph.
- If WebGL 2 is unavailable, the SVG reactor in `src/components/viz/` is shown instead. Low-power devices get fewer particles, and `prefers-reduced-motion` is respected.
- Impeller speed is a visual setting; it is not a model variable.

## References

Monod (1949) *Annu. Rev. Microbiol.* 3:371–394 · Luedeking & Piret (1959) *J. Biochem. Microbiol. Technol. Eng.* 1:393–412 · Shuler & Kargı, *Bioprocess Engineering: Basic Concepts* · Doran, *Bioprocess Engineering Principles*.
