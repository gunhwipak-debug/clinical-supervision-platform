# ClinicFlow Design Judgment

Status: experimental StyleSeed-informed guidance
Scope: `experiment/styleseed-clinicflow-heavy-reconstruction`

## Purpose

ClinicFlow is a desktop-first clinical supervision workbench. The product should read as a professional tool for hospitals, training programs, supervisors, and supervisees. It should not read as a generic SaaS dashboard, startup toy, or decorative AI-card interface.

StyleSeed is used here as a design judgment system, not as a visual skin. ClinicFlow keeps its Origin-14 baseline, Noto Sans KR typography, electric-blue interaction accent, and clinical workflow information architecture.

## Judgment Hierarchy

1. Clinical workflow clarity
2. Role and state clarity
3. Coherent visual system
4. Commercial trust
5. Visual polish

If a StyleSeed rule conflicts with clinical workflow clarity, the workflow rule wins. Example: StyleSeed's generic "all content in cards" rule does not override ClinicFlow's row/table-first operational pages.

## Clinical Workbench Skin

### Color

- One interaction accent: ClinicFlow electric blue `#2563ff`.
- Everything else should be grayscale or semantic state color.
- Semantic colors are meaning-only: success, warning, error, info.
- Avoid decorative color blocks, gradient accents, and mixed accent systems.

### Surface

- App background: quiet white or near-white.
- Shell/sidebar: stable app chrome with a subtle right border.
- Workbench surface: white surface with thin border.
- Row surface: flat or lightly separated.
- Selected row/status: blue tint only when selected or active.
- Modal/sheet: higher surface with restrained shadow.

### Radius

- Operational pages use smaller radii than public marketing surfaces.
- Parent radius must be larger than nested controls.
- Avoid mixing pill-heavy controls with sharp workbench frames.

### Shadow

- Prefer border and surface contrast.
- Shadows must stay subtle; if the shadow is the first visible feature, it is too strong.
- Dark panels are exceptional and reserved for blocking states.

### Typography

- Authenticated H1: compact, workbench-scale.
- Public H1: may be stronger, but still product-specific.
- Korean UI text should remain readable at 14px or above for controls and operational rows.
- Labels use small uppercase-style tracking only for category/system metadata, not body copy.

### Spacing

- Outer section gap is larger than inner row gap.
- Tables/lists use compact rhythm.
- Do not equalize all gaps; proximity should indicate grouping.

## Component Decisions

- Static metadata belongs in a compact top status bar.
- Side panels are for decision/input support only.
- Operational data belongs in table/list/row surfaces.
- Directory pages can use compact profile cards or comparison rows.
- `PrimaryActionPanel` is exceptional.
- `AdminCard` is for summaries, not operational rows.
- Empty/loading/error states are compact by default.

## Anti-Noise Rules

Avoid generic helper copy and repeated labels such as:

- `다음 행동`
- `확인 필요`
- `먼저`
- `요약`
- `운영 메모`
- `검토 요약`

Use route-specific copy tied to the actual clinical workflow state.

## Review Checklist

- Is there exactly one accent color?
- Are semantic colors used only for meaning?
- Do radius, shadow, spacing, and typography feel like one system?
- Does the layout support the role's next real workflow decision?
- Is an operational list still row/table-first?
- Does any visible element exist only to fill space?
- Would a hospital procurement reviewer trust this surface?
