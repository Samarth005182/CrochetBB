---
name: Luxe Craft Narrative
colors:
  surface: '#08122a'
  surface-dim: '#08122a'
  surface-bright: '#2f3952'
  surface-container-lowest: '#030d25'
  surface-container-low: '#101b33'
  surface-container: '#151f37'
  surface-container-high: '#1f2942'
  surface-container-highest: '#2a344d'
  on-surface: '#d9e2ff'
  on-surface-variant: '#c5c6cd'
  inverse-surface: '#d9e2ff'
  inverse-on-surface: '#263049'
  outline: '#8f9097'
  outline-variant: '#44474d'
  surface-tint: '#b9c7e4'
  primary: '#b9c7e4'
  on-primary: '#233148'
  primary-container: '#0a192f'
  on-primary-container: '#74829d'
  inverse-primary: '#515f78'
  secondary: '#c8c6c3'
  on-secondary: '#30312e'
  secondary-container: '#474744'
  on-secondary-container: '#b6b5b1'
  tertiary: '#b6c6ed'
  on-tertiary: '#20304f'
  tertiary-container: '#061836'
  on-tertiary-container: '#7282a5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#e4e2de'
  secondary-fixed-dim: '#c8c6c3'
  on-secondary-fixed: '#1b1c1a'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#b6c6ed'
  on-tertiary-fixed: '#091b39'
  on-tertiary-fixed-variant: '#374767'
  background: '#08122a'
  on-background: '#d9e2ff'
  surface-variant: '#2a344d'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style

The brand identity centers on the "Luxe Craft" philosophy—elevating traditional crochet from a hobbyist aesthetic to a high-end boutique experience. The visual narrative balances the warmth of handmade artistry with the discipline of luxury fashion. It targets a discerning audience that values slow fashion, intricate detail, and artisanal quality.

The design style is **Minimalist with Editorial influences**. It utilizes heavy whitespace (or "color-space" in dark mode) to allow product photography to breathe, mimicking the layout of a premium fashion lookbook. The emotional response is one of calm, sophistication, and quiet confidence. By avoiding the cluttered patterns often associated with craft sites, this design system establishes authority and premium positioning.

## Colors

The palette is anchored in a deep, monochromatic blue spectrum to evoke a sense of nocturnal elegance. 

*   **Primary (Midnight Navy):** Used for the main background surfaces to create a canvas of depth.
*   **Secondary (Soft Cream):** Used for primary typography and high-contrast call-to-action elements. This off-white prevents the harshness of pure white against dark blue.
*   **Tertiary (Deep Indigo):** Used for subtle layering, such as card backgrounds or header containers.
*   **Neutral (Slate Blue):** Used for secondary text, borders, and inactive states.

The color strategy relies on "Tonal Depth," where different shades of dark blue are used to define hierarchy rather than relying on lines or shadows.

## Typography

This design system employs a classic "Serif/Sans" pairing to bridge the gap between tradition and modernity. 

**Libre Caslon Text** is used for headlines and display elements. Its high-contrast strokes and traditional serifs reflect the intricate "stitch-by-stitch" nature of crochet. **Hanken Grotesk** provides a clean, contemporary counterpoint for body copy and UI labels, ensuring high legibility and a professional SaaS-like efficiency in the shopping experience. 

For mobile, large display type should scale down aggressively to maintain the editorial feel without breaking containers.

## Layout & Spacing

The layout follows a **Fixed Grid** approach for desktop and a **Fluid Grid** for mobile. 

*   **Desktop:** A 12-column grid with a 1280px max-width centered in the viewport. Large internal margins (64px) are used to create an "expensive" feel, preventing the content from feeling cramped.
*   **Mobile:** A 4-column fluid grid with 16px margins.
*   **Sectioning:** High-end boutique feel is achieved through generous vertical breathing room. "Section-gap" (120px) should be used between major content blocks to emphasize exclusivity.

The spacing rhythm is based on a 4px baseline, with most components using 8px (base), 16px (double), or 24px (triple) increments for internal padding.

## Elevation & Depth

To maintain the "Luxe" feel, avoid heavy drop shadows which can feel dated. Instead, use **Tonal Layers** and **Low-contrast Outlines**:

1.  **Surfaces:** The base background is the darkest blue. Secondary containers (like product cards) use a slightly lighter indigo hue to create a "lifted" appearance without needing shadows.
2.  **Outlines:** Use 1px borders in a muted Slate Blue (neutral) with 10-20% opacity. This provides structure for inputs and cards while remaining nearly invisible.
3.  **Active Depth:** When an element is focused or hovered, use a subtle 10% Soft Cream overlay rather than a shadow to indicate interaction. 
4.  **Glassmorphism:** Reserved exclusively for the primary navigation header. A subtle backdrop-blur (10px) with 80% opacity of the background color allows product images to scroll underneath beautifully.

## Shapes

The design uses **Soft (1)** roundedness. 

While crochet is inherently soft and organic, the UI should provide a structured, professional frame. 4px corners (0.25rem) are applied to buttons, cards, and input fields. This subtle rounding maintains a clean, modern edge that distinguishes the boutique from "cute" or "whimsical" craft sites, reinforcing the premium "Luxe" positioning. 

Image containers may occasionally use a "soft-pill" (rounded-lg) for specific decorative callouts, but the core UI remains crisp.

## Components

*   **Buttons:** Primary buttons use the Soft Cream background with Midnight Navy text. No border. Secondary buttons use a transparent background with a 1px Soft Cream border. All buttons use uppercase Label-LG typography.
*   **Product Cards:** Minimalist frames. The image should occupy 80% of the card height. Titles in Headline-MD, prices in Body-LG. No shadows; use tonal Indigo background on hover.
*   **Chips/Tags:** Used for "Handmade" or "Limited Edition" labels. Small, pill-shaped, with a subtle border and Label-SM typography.
*   **Input Fields:** Ghost style—transparent background with a 1px Slate Blue bottom border only. On focus, the border transitions to Soft Cream.
*   **Checkboxes & Radios:** Minimal geometric squares/circles. Use the Soft Cream as the fill color for the selected state.
*   **Specialty Component (The "Loom" Gallery):** An asymmetrical grid for showcasing crochet textures. Images should have varying aspect ratios (2:3 and 4:5) to mimic the feel of a high-end fashion magazine.