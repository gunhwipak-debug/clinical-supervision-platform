---
name: Clinical Trust System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#45464d'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#151c23'
  on-tertiary-container: '#7d858d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#dce3ec'
  tertiary-fixed-dim: '#c0c7d0'
  on-tertiary-fixed: '#151c23'
  on-tertiary-fixed-variant: '#40484f'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

This design system is built on the pillars of **Professionalism, Security, and Clarity**. Designed specifically for the clinical supervision landscape in Korea, it balances a rigorous medical aesthetic with the approachable nature required for mentorship and mental health discourse.

The visual style is **Corporate / Modern**. It leverages a disciplined "SaaS" architecture that prioritizes information density and logical flow over marketing-heavy flourishes. The interface uses generous whitespace to reduce cognitive load during complex clinical reviews, while maintaining a sense of stability through a deep navy and slate color palette. The goal is to evoke a sense of quiet confidence—ensuring that the platform feels like a high-security, professional tool rather than a social networking app.

## Colors

The color strategy for this design system is anchored in **Clinical Navy** to establish authority and trust. 

- **Primary (#0F172A):** Reserved for core navigation, high-level headings, and primary brand moments to signify security.
- **Secondary (#3B82F6):** Used for "Action" states. This bright, approachable blue guides users toward completion and progress.
- **Surface & Background (#F8FAFC, #F1F5F9):** Soft grays are used to differentiate work areas from the background, minimizing eye strain during long reading sessions.
- **Semantic Colors:** Success (Green), Warning (Amber), and Error (Red) should be desaturated to fit the calm clinical environment.

For Korean typography, the "Ink" color is slightly softened from pure black to **#1E293B** to improve legibility and reduce "vibration" on high-brightness monitors.

## Typography

This design system uses **Hanken Grotesk** for headlines to provide a sharp, contemporary professional feel, and **Inter** for body text due to its exceptional legibility in data-heavy clinical environments.

**Korean Typography Considerations:**
- When rendering Korean text, ensure the `lang="ko"` attribute is set to trigger optimal font-weight rendering for Pretendard or Apple SD Gothic Neo (the system fallbacks).
- Line heights for body text are set to **1.6** to accommodate the vertical complexity of Hangul characters.
- "Body-md" is the default for most clinical notes, while "Body-sm" is reserved for meta-data and sidebars.

## Layout & Spacing

The layout is based on a **12-column fluid grid** for desktop, transitioning to a **single-column flow** for mobile (390px). 

- **Desktop (1280px+):** Fixed centered container with 24px gutters.
- **Mobile (390px):** 16px side margins.
- **Rhythm:** An 8px base unit (linear scale) governs all padding and margins to ensure a tight, logical SaaS structure.

Spacing is used to group related clinical data. Use `xl` (40px) to separate major sections like "Patient History" from "Supervision Goals," and `md` (16px) for internal card padding.

## Elevation & Depth

Hierarchy in this design system is primarily conveyed through **Tonal Layers** rather than heavy shadows, maintaining a clean and modern clinical look.

- **Level 0 (Background):** #F8FAFC.
- **Level 1 (Cards/Surface):** White (#FFFFFF) with a thin 1px border (#E2E8F0). No shadow.
- **Level 2 (Popovers/Modals):** White with a soft, ambient shadow: `0px 10px 15px -3px rgba(15, 23, 42, 0.08)`. This tinting with the primary navy color keeps shadows looking clean rather than muddy.
- **Interactive States:** On hover, interactive elements should use a subtle background shift (e.g., to #F1F5F9) rather than an elevation increase.

## Shapes

The shape language utilizes **Level 2 (Rounded)** settings to soften the clinical feel while remaining professional.

- **Components:** Buttons and input fields use a `0.5rem` (8px) radius.
- **Containers:** Dashboard cards and modal containers use `1rem` (16px) to create a distinct frame for content.
- **Status Indicators:** Pills (for status like "Completed" or "Pending") use a full `999px` radius to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid #0F172A background with white text. High-contrast for "Submit" or "Save" actions.
- **Secondary:** Outline #E2E8F0 with #1E293B text. For "Cancel" or "View Details."
- **Ghost:** No border, blue text. Used for secondary navigation within clinical logs.

### Input Fields
Inputs must feel stable. Use a 1px border (#E2E8F0) that thickens to 2px #3B82F6 on focus. Labels should always be visible (never placeholder-only) to maintain accessibility for medical records.

### Clinical Cards
The primary container for clinical summaries. It features a 1px border, 16px padding, and a "Header" area with a #F8FAFC background to separate metadata from the main content.

### Chips/Badges
Used for categorization (e.g., "Counseling," "Evaluation"). Use light secondary backgrounds (#EFF6FF) with dark blue text (#1E293B).

### Data Lists
Standardized list items for supervision logs. 12px vertical padding, with a subtle border-bottom to separate entries. Mobile versions stack the timestamp above the entry title.