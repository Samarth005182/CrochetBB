import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import LaxParallaxDemo, {
  parseLaxString,
  interpolateLaxValue,
  computeLaxStyles,
  LaxBox,
} from '../components/LaxParallaxEffects';

describe('Lax.js Declarative Parallax Engine', () => {
  it('correctly parses the required technical spec string "translateY 0 200 | opacity 1 0"', () => {
    const rules = parseLaxString('translateY 0 200 | opacity 1 0');
    expect(rules).toHaveLength(2);

    const translateYRule = rules.find((r) => r.property === 'translateY');
    expect(translateYRule).toBeDefined();
    expect(translateYRule?.points).toEqual([
      { scroll: 0, value: 0 },
      { scroll: 300, value: 200 },
    ]);

    const opacityRule = rules.find((r) => r.property === 'opacity');
    expect(opacityRule).toBeDefined();
    expect(opacityRule?.points).toEqual([
      { scroll: 0, value: 1 },
      { scroll: 300, value: 0 },
    ]);
  });

  it('interpolates intermediate scroll values smoothly', () => {
    const points = [
      { scroll: 0, value: 0 },
      { scroll: 100, value: 200 },
    ];

    expect(interpolateLaxValue(points, 0)).toBe(0);
    expect(interpolateLaxValue(points, 50)).toBe(100);
    expect(interpolateLaxValue(points, 100)).toBe(200);
    expect(interpolateLaxValue(points, 150)).toBe(200); // Clamped to bounds
  });

  it('computes hardware-accelerated CSS styles for translate and opacity', () => {
    const rules = parseLaxString('translateY 0 200 | opacity 1 0');
    const { styles } = computeLaxStyles(rules, 150);

    expect(styles.opacity).toBeCloseTo(0.5, 1);
    expect(styles.transform).toContain('translate3d(0px, 100px, 0px)');
  });

  it('renders LaxBox with custom data-lax attribute', () => {
    render(
      <LaxBox data-lax="translateY 0 200 | opacity 1 0" scrollY={0} data-testid="lax-box">
        <span>Test Parallax Content</span>
      </LaxBox>,
    );

    const el = screen.getByTestId('lax-box');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('data-lax')).toBe('translateY 0 200 | opacity 1 0');
    expect(screen.getByText('Test Parallax Content')).toBeInTheDocument();
  });

  it('renders LaxParallaxDemo component with live stage and controls', () => {
    render(<LaxParallaxDemo />);
    expect(screen.getByText(/Declarative Parallax Effects/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Stage/i)).toBeInTheDocument();
    expect(screen.getByText(/Presets Library/i)).toBeInTheDocument();
  });
});
