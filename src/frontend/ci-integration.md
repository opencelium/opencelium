# CI Integration — What the Marketing team must provide

> Context: the frontend theme system is ready (palette files + theme registry, everything token-driven).
> Integrating the Corporate Identity = filling one `ciPalette.ts` file + two registry entries.
> This list is what marketing needs to deliver so that can happen without rework.

## A. Must-have (without this, no CI theme)

| # | Item | Format | Why we need it |
|---|---|---|---|
| 1 | **Primary brand color** | one hex value `#RRGGBB` | Becomes `palette.primary` — buttons, links, active states, focus rings, selected workflow nodes |
| 2 | **Secondary / accent color** | one hex value | Becomes `palette.accent` — secondary actions, badges, secondary chart lines, decorative highlights |
| 3 | **Neutral / gray tone** | one hex value OR "pure gray" | Becomes the tint of all backgrounds, borders, and secondary text (the 13-step gray ladder is tinted ~8% toward it — decides between a slate-ish vs warm-gray look) |

**Important: values must be digital RGB hex.** Pantone or CMYK-only brand books are not enough — ask explicitly for the *screen/digital* values from the brand guide.

## B. Should-have (we can derive defaults, but the CI may prescribe them)

| # | Item | Format | Default if not provided |
|---|---|---|---|
| 4 | **Dark-mode variants** | hex per brand color, or "derive them" | Dark scales are auto-generated against `#141414` (same as Ant Design's dark algorithm) |
| 5 | **Status colors** — success / warning / error / info | 4 hex values, or "use defaults" | Ant Design presets (`#52c41a` / `#faad14` / `#ff4d4f` / `#1677ff`). Only override if the brand book prescribes its own semantic colors. **Also ask:** does any brand color collide with a status color (e.g. brand red ≈ error red)? |
| 6 | **Text on primary buttons** | "white" or "black" | White — but depends on how light their primary is (WCAG contrast) |
| 7 | **Full color ramps** | 10 steps per color (50–900 style), if the brand book has them | 10-step scales are generated from each seed via the antd algorithm; hand-tuned ramps from the brand book win over generated ones |

## C. Nice-to-have (affects more than colors)

| # | Item | Format | Where it lands |
|---|---|---|---|
| 8 | **Typography** — corporate UI font + monospace preference | font name + **licensed woff2 files** (or hosted link) + allowed weights (we use 400/500/600) | `typography.fontFamily` tokens (currently Inter + JetBrains Mono) |
| 9 | **Corner radius / shape language** | "sharp", "rounded", or px values | `radius` tokens (currently 4/8/12 px) — propagates to every antd/MUI component |
| 10 | **Logo assets** | SVG (preferred), light + dark variants | Sidebar, login page, favicon |
| 11 | **Accessibility target** | e.g. "WCAG 2.1 AA" | Text/background token pairs get validated against it before shipping |
| 12 | **The brand guide itself** | PDF / Figma link | Resolves every follow-up question without another meeting |

## D. Good questions to ask in the same conversation

1. Is there an existing **digital product** already using the CI (website, app)? A link beats any spec — working values can be extracted from it.
2. Are there **forbidden uses** (e.g. "brand red must never indicate errors", "logo never on colored background")?
3. Should the **default theme** for all users become CI-light, or stay Ant light with CI as an option?
4. Is **CI-dark** wanted at launch, or is light-only fine for v1 (dark derivable later)?
5. Who **signs off** the visual result? (One review pass on the running app, both light and dark.)

## E. What happens with the delivery (for context)

- Items 1–3 (+ optional 4–7) → `src/shared/theme/palette/ciPalette.ts`, mirroring `antPalette.ts`
- Two registry entries (`ci-light`, `ci-dark`) in `themeRegistry.ts` → theme appears in the picker automatically
- Items 8–9 → typography/radius adjustments in `buildTheme.ts` (or per-theme overrides)
- Effort once values are in hand: **~half a day** including a both-mode visual review

**Minimal viable request, if marketing is slow:** just the three hex values from section A — everything else has sane defaults and can be refined later without rework.

---

## F. CI candidates found on opencelium.io (2026-06-05 analysis)

Extracted from the landing page HTML/CSS, the header logo PNG, and the favicon. **These are educated guesses to confirm with marketing, not a sign-off substitute** — the site is WordPress/Divi, so stock theme colors are mixed in with brand colors.

### High confidence (deliberately brand-styled)

| Color | Hex | Evidence | Maps to |
|---|---|---|---|
| **Logo blue** | `#1b72b9` (logo PNG) / `#2772b9` (CSS) / `#2e6ca6` (favicon) | Dominant color of the OpenCelium logo mark; `#2772b9` is hand-written in the site CSS for borders/buttons | → `palette.primary` seed (ask which exact value is canonical) |
| **Dark blue** | `#194c77` | Hand-written CSS, used as darker companion to the brand blue (hover/pressed) | → confirms generated dark steps of the primary scale |
| **Teal** | `#15779b` (+ hover `#11607d`) | List bullets, separators, accordion arrows — and they custom-styled the cookie-consent banner with it (deliberate brand choice) | → `palette.accent` seed |
| **Slate dark** | `#2c3d49` (59×) / `#1f2b33` (54×) | The two most-used colors on the page — section/header/footer backgrounds, forced with `!important` | → `palette.neutral` tint seed (cool slate-gray ladder) |
| **Logo gray** | `#7f7f7f` | The wordmark text color in the logo | → consistent with a neutral-gray text scale |

### Do NOT treat as brand without confirmation

| Color | Hex | Why suspicious |
|---|---|---|
| Bright link blue | `#2ea3f2` | This is **Divi's factory default** accent — every unconfigured Divi site has it |
| CTA orange | `#ff4200` | Appears only in **Divi-Pixel plugin default** widget styles (pagination, toggles) — likely never consciously chosen. If marketing says orange IS brand (it's visible on the site), it would make a strong accent candidate instead of the teal |

### Draft `ciPalette.ts` seeds (pending marketing confirmation)

```
primary: #2772b9   (or logo-exact #1b72b9)
accent:  #15779b
neutral: #2c3d49   (slate tint for the gray ladder)
```

These three values are enough for a working CI theme draft today — worth building as `ci-light`/`ci-dark` preview and showing marketing something concrete instead of asking abstract questions.

### Open questions for marketing — ANSWERED (2026-06-05)

1. Canonical primary blue: **`#007bff`** (none of the website values — straight from marketing)
2. Orange `#ff4200`: **plugin accident**, not CI — ignored
3. Teal `#15779b`: **official secondary** → accent
4. **Open Sans is the corporate font** → bundled (variable woff2, latin + latin-ext) and wired as the CI themes' font

### ✅ CI integrated

- `src/shared/theme/palette/ciPalette.ts` — seeds `#007bff` / `#15779b` / `#2c3d49` (slate neutral tint)
- `ci-light` / `ci-dark` registered ("OpenCelium Light/Dark" in the theme picker), family `ci` → light/dark toggle works within it
- Open Sans self-hosted in `src/assets/fonts/`, applied per-theme via `ThemeDefinition.fontFamily` → CSS var + antd `token.fontFamily` + MUI `typography.fontFamily`
- Default theme remains `ant-light` — flip to CI by registering CI first (registry default = first entry) or changing `initialThemeId` in `UIProviders.tsx`, pending a decision
- Still open: visual sign-off on the running app (both modes) by marketing
