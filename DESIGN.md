---
name: Bioreactor Lab
description: A browser bioreactor simulator where one trajectory drives the vessel, the readouts and the figures.
colors:
  canvas: "#F6F6F4"
  surface: "#FFFFFF"
  sunken: "#EFEFEC"
  line: "#E3E3DF"
  line-strong: "#CBCBC5"
  ink: "#17191C"
  ink-hover: "#2B2E33"
  ink-2: "#4A4F55"
  ink-3: "#6B7077"
  ink-4: "#9A9EA3"
  accent: "#0E6B63"
  accent-hover: "#0A5750"
  accent-soft: "#E4F0EE"
  accent-line: "#9CC7C1"
  series-biomass: "#C18A12"
  series-substrate: "#1F6FA8"
  series-product: "#B23A5A"
  series-growth-rate: "#3B8A3E"
  series-volume: "#6A5AB5"
  warn: "#8F5200"
  warn-soft: "#FBF1E0"
  danger: "#B42318"
  danger-soft: "#FDEDEB"
  ok: "#1D6B45"
  ok-soft: "#E6F2EB"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 5.2vw, 4.6rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.4vw, 2.9rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 2.2vw, 1.9rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  subtitle:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
    fontFeature: "'ss01', 'cv11'"
  ui:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  measurement:
    fontFamily: "Red Hat Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
    fontFeature: "'tnum'"
  meta:
    fontFamily: "Red Hat Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "14px"
    fontFeature: "'tnum'"
  math:
    fontFamily: "STIX Two Text, Cambria, Times New Roman, serif"
    fontSize: "1.3rem"
    fontWeight: 400
    lineHeight: 1.7
    fontFeature: "'ssty'"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 14px"
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 14px"
  button-ghost-hover:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
  field-numeric:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.measurement}"
    rounded: "{rounded.sm}"
    height: "28px"
    width: "4.75rem"
    padding: "0 8px"
  segmented:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-3}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    padding: "3px"
  segmented-item-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "28px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  menu:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "4px"
  menu-item:
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  menu-item-hover:
    backgroundColor: "{colors.sunken}"
  tooltip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    width: "16rem"
    padding: "12px"
  nav-link:
    textColor: "{colors.ink-3}"
    typography: "{typography.ui}"
    padding: "0 12px"
  nav-link-active:
    textColor: "{colors.ink}"
---

# Design System: Bioreactor Lab

## Overview

**Creative North Star: "The Research Bench"**

Contemporary research software played straight. A neutral light bench (warm off-white ground, white sheets, hairline rules) holds a live instrument: the 3D vessel, numeric readouts set in a monospace, and journal-style figures. Charcoal ink does the structural work, carrying text, primary actions and selected states; a single restrained teal is reserved for the Run action, links, focus rings and the caret. Colour otherwise belongs to data: each simulated quantity owns one validated hue everywhere it appears.

Density is that of a working tool, not a brochure. The UI is set in 13px and 12px grotesk with tabular mono numbers; headlines are large, tight-tracked and semibold, and there are few of them. Structure comes from hairlines and alignment rather than boxed cards and shadows; elevation is reserved for things that float over content. Mathematics is typeset like a paper, in STIX Two italic with equation numbers in the margin.

The world explicitly refuses the dark neon HUD dashboard it replaced: no glow, no glass panels, no gradients, no dark mode.

**Key Characteristics:**
- Light neutral bench (#F6F6F4) with white sheets and 1px hairlines
- Charcoal ink as the primary action and selection colour; teal used sparingly
- One fixed colour per simulated quantity (X, S, P, mu, V)
- Three voices: Schibsted Grotesk for UI and display, Red Hat Mono for measurements, STIX Two for mathematics
- Small radii (4-8px), shadows only on floating layers
- Figures and equations numbered and captioned like a publication

## Colors

A near-achromatic bench and ink scale, one teal accent, and a colour-blind-checked data palette that is never used decoratively.

### Primary
- **Charcoal Ink** (ink): body text, headlines, the primary button fill, the active nav underline, selected-state text, and the filled portion of range tracks. Hovers to ink-hover.
- **Bench Teal** (accent): the simulation Run action (accent button), text links and their underline (accent-line at rest, accent on hover), the focus ring, the input caret, the "changed from preset" dot, and pressed icon buttons (on accent-soft). Selection highlight is a pale teal (#CFE5E1 with #0B2E2A text).

### Data Series
- **Biomass Ochre** (series-biomass): X.
- **Substrate Blue** (series-substrate): S.
- **Product Berry** (series-product): P.
- **Growth Green** (series-growth-rate): mu.
- **Volume Violet** (series-volume): V.

X, S and P are validated to share one chart; mu and V always sit on charts of their own. The same hex drives Tailwind, SVG charts and WebGL (mirrored in `src/lib/palette.ts`).

### Status
- **Warn Umber** (warn / warn-soft), **Alarm Red** (danger / danger-soft), **Settled Green** (ok / ok-soft): phase and washout indicators, invalid-field rings, the vessel alert. Each has a `-line` border tint in config for bordered notices.

### Neutral
- **Bench** (canvas): page ground.
- **Sheet White** (surface): inspector panels, figures, menus, popovers, fields.
- **Sunken** (sunken): segmented-control track, ghost and menu-item hover.
- **Hairline** (line) and **Strong Hairline** (line-strong): dividers, table rules, field and secondary-button borders.
- **Ink 2 / 3 / 4**: lede and prose, labels and meta, placeholders and disabled marks.

### Named Rules
**The Ink Carries Weight Rule.** Primary actions and selected states are charcoal, not teal. Teal appears only for Run, links, focus and caret; if a screen has teal anywhere else, it is wrong.

**The Data Owns Colour Rule.** A series hue means exactly one quantity, on every surface (charts, readout keys, the vessel). Never reuse a series colour for decoration, status or branding.

## Typography

**Display Font:** Schibsted Grotesk (with ui-sans-serif, system-ui)
**Body Font:** Schibsted Grotesk, with stylistic sets ss01 and cv11
**Label/Mono Font:** Red Hat Mono (with ui-monospace)
**Math Font:** STIX Two Text (with Cambria, Times New Roman)

**Character:** A crisp, slightly condensed grotesk that reads as software, paired with a humanist mono for every number a user compares, and a proper math serif so equations look set, not typed.

### Hierarchy
- **Display** (600, clamp 2.6-4.6rem, 1.02, -0.035em): the Home hero headline only.
- **Headline** (600, clamp 2-2.9rem, 1.06): page titles on Experiments, Learn, Methodology.
- **Title** (600, clamp 1.45-1.9rem, 1.15): section headings on reading pages.
- **Subtitle** (600, 17px, 1.35): panel and card headings, Lab section titles.
- **Lede** (400, 18px, 1.6, ink-2): the one introductory paragraph under a headline.
- **Body** (400, 15px/24px): prose, capped at 68ch.
- **UI** (500, 13px/18px): buttons, nav, menus, table cells, segmented items.
- **Label** (500, 12px/16px, ink-3): field names, panel labels, figure captions, table headers. Sentence case.
- **Measurement** (Red Hat Mono, 13px, tabular): field values and readouts; units follow in a smaller ink-3 mono.
- **Meta** (Red Hat Mono, 11px, tabular, ink-3): timestamps, figure numbers, equation numbers.

### Named Rules
**The Tabular Numbers Rule.** Any number read against another number is mono with tabular figures (`tnum`). Proportional digits in a readout, table or field are a bug.

**The Sentence-Case Label Rule.** Labels are small, quiet, sentence case and medium weight. No uppercase, no wide letterspacing.

**The Typeset Math Rule.** Symbols and equations render in STIX Two italic with `ssty`, subscripts at 0.7em; upright units via `.up`. Display equations are centred between hairlines with a mono equation number at the right margin.

## Layout

Content sits in a 1440px page container with 16px gutters (24px from `sm`). The sticky nav is 52px high on a 90% canvas, gaining a hairline bottom border once scrolled.

The Lab is a three-column instrument: a sticky Configure inspector on the left, vessel and transport in the centre, Observe measurements on the right, with Analyze figures full width below. Columns are divided by hairlines, not gutters of empty space. Reading pages use two-column grids (`minmax(0,1fr)` pairs, or a 220px rail beside content) that collapse to one column below `lg`. Home runs a text column beside the full-height vessel.

Spacing follows a 4px base: 8 and 12px inside controls, 16-24px inside panels, 48px and up between page sections. Rows in the inspector and readout list are separated by hairlines rather than spacing alone.

## Elevation & Depth

Flat by default. Resting surfaces (inspector, figures, tables, sheets) sit on the bench with a 1px hairline and no shadow. Shadow appears only on layers that float over other content.

### Shadow Vocabulary
- **Pop** (`0 1px 2px rgba(23,25,28,0.05), 0 10px 28px -8px rgba(23,25,28,0.16)`): menus, popovers, info tooltips, chart hover readouts, the floating compare bar.
- **Lift** (`0 1px 2px rgba(23,25,28,0.06), 0 2px 8px -2px rgba(23,25,28,0.08)`): small toolbars and notices overlaid on the 3D stage.
- **Seg pill** (`0 0 0 1px rgba(23,25,28,0.06), 0 1px 2px rgba(23,25,28,0.08)`): the sliding selected pill in segmented controls.
- **Key cap** (`0 1px 0 #CBCBC5`): keyboard hints.

### Named Rules
**The Hairline Not Card Rule.** Group content with a 1px line or a white sheet with a hairline. If a resting panel has a drop shadow, remove it.

## Shapes

Small, consistent radii: 4px for fields, key caps and segmented pills; 6px for buttons, icon buttons, menu items and tooltips; 8px for sheets, menus and figure frames; 12px is available but rare. Full rounding is reserved for tiny status dots, progress hairlines, range thumbs and scrollbar thumbs. Series keys are 14x2px line segments (dashed where the chart line is dashed), like a figure legend. Reactor schematics are simple line drawings of the vessel with its inflow and outflow.

## Components

### Buttons
Compact and quiet; they press, they do not glow.
- **Shape:** gently rounded (6px), 34px high, 14px side padding; small 28px, large 42px.
- **Primary:** charcoal fill, white 13px medium text. Used for Open the Lab and main page actions.
- **Accent:** teal fill, reserved for the simulation Run action.
- **Secondary:** white with a strong hairline border and a 1px whisper shadow; hover darkens the border to ink-4.
- **Ghost:** transparent, ink-2 text; hover fills sunken.
- **Hover / Focus / Active:** 150ms colour transitions; `:active` scales to 0.97 on the smooth-out curve; focus is a 2px teal outline at 2px offset. Disabled at 45% opacity.
- **Icon button:** 32px square, ghost behaviour, `aria-pressed` fills accent-soft with teal icon.

### Segmented Control
Sunken 3px-padded track with a white pill that slides (250ms, smooth-out) under the selected item. Used for reactor mode, speed and view toggles. The reactor selector variant carries a schematic and a two-line label per item.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** white on the bench.
- **Shadow Strategy:** none at rest (see Elevation).
- **Border:** 1px hairline.
- **Internal Padding:** 16-24px.

### Inputs / Fields
- **Numeric field:** 28px high, 4.75rem wide, right-aligned tabular mono, strong-hairline border, 4px radius; hover border ink-4; focus teal border plus a 3px teal ring at 14%; invalid uses the danger border and ring.
- **Range slider:** 2px track (filled ink, rest #DCDCD7) with a 14px white thumb ringed in ink; thumb scales 1.15 on hover and 1.25 while dragging; focus turns the ring teal.
- Each parameter pairs label, math symbol, field, unit and slider on one row; a description reveals under it while the row has focus.

### Navigation
Logo and wordmark left, four 13px medium links centre, a small primary button right. Inactive links ink-3, active ink with a 1.5px ink underline that slides between links. Below `md` the links fold into a disclosure menu of full-width hairline rows with a dot on the current route.

### Menus, Popovers, Tooltips
White, hairline border, 8px radius, Pop shadow. Open with a 250ms scale-from-0.97 fade from the trigger's corner; close in 150ms. Menu items are 13px rows that fill sunken on hover.

### Figures
Charts are the design. A mono figure number ("Fig. 1") precedes a medium title, a label-size caption sits beneath, the series key sits right. Axes and grid are hairline grey, lines take their series hue, the playback head is a dotted rule with an event label.

### Readouts
The Observe list: series key segment, label with its math symbol, and a large tabular mono value with a small unit, rows separated by hairlines.

### 3D Vessel
A light studio render on a pale bench grid: glass, steel and a dark base, broth coloured by the simulation state. Overlaid controls use the Lift toolbar. An SVG fallback vessel animates bubbles, cells and impeller with transform and opacity only.

### Motion
Everything eases on `cubic-bezier(0.22, 1, 0.36, 1)`. Micro feedback 80-150ms, controls 250ms, routes cross-fade (140ms out, 260ms in with a 6px rise), scroll reveals 600ms with a 14px rise. Reduced motion collapses all of it.

## Do's and Don'ts

### Do:
- **Do** keep the bench light: canvas #F6F6F4, white sheets, 1px hairlines.
- **Do** use charcoal ink for primary actions and selected states; keep teal for Run, links, focus and the caret.
- **Do** colour a quantity only with its series hue, and use that hue for it everywhere.
- **Do** set every compared number in Red Hat Mono with tabular figures, units in smaller ink-3.
- **Do** typeset equations in STIX Two, centred between hairlines with a margin equation number.
- **Do** number and caption figures like a publication.
- **Do** keep radii at 4-8px and reserve shadows for floating layers.
- **Do** ease on the smooth-out curve and honour reduced motion.

### Don't:
- **Don't** build dark neon HUD dashboards, glowing elements, or dark mode.
- **Don't** use gradients as decoration (the range-track fill and dashed swatch are functional, not ornament).
- **Don't** put drop shadows on resting cards or panels.
- **Don't** use uppercase, widely tracked labels or eyebrow kickers above headings.
- **Don't** use a series hue for decoration, branding or status.
- **Don't** use proportional figures in readouts, fields or tables.
