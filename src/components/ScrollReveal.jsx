import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

/**
 * ScrollReveal Component
 * Smoothly animates children into view when scrolled into the viewport.
 */
export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  distance = '32px',
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  once = true,
  className = '',
  style = {},
  as: Component = 'div',
  ...props
}) {
  const [ref, isVisible] = useScrollReveal({ threshold, rootMargin, once });

  const getInitialTransform = () => {
    switch (variant) {
      case 'fade-up':
        return `translate3d(0, ${distance}, 0)`;
      case 'fade-down':
        return `translate3d(0, -${distance}, 0)`;
      case 'fade-left':
        return `translate3d(${distance}, 0, 0)`;
      case 'fade-right':
        return `translate3d(-${distance}, 0, 0)`;
      case 'zoom-in':
        return 'scale(0.92)';
      case 'blur-in':
        return 'translate3d(0, 16px, 0)';
      default:
        return `translate3d(0, ${distance}, 0)`;
    }
  };

  const getInitialFilter = () => {
    if (variant === 'blur-in') {
      return 'blur(10px)';
    }
    return 'none';
  };

  const transitionStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : getInitialTransform(),
    filter: isVisible ? 'blur(0px)' : getInitialFilter(),
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    willChange: 'opacity, transform, filter',
    ...style,
  };

  return (
    <Component ref={ref} style={transitionStyle} className={className} {...props}>
      {children}
    </Component>
  );
}

/**
 * Stagger Container Helper
 * Animates direct children with incremental delays.
 */
export function ScrollStagger({
  children,
  stagger = 100,
  baseDelay = 0,
  variant = 'fade-up',
  duration = 700,
  distance = '28px',
  className = '',
  as: Component = 'div',
  ...props
}) {
  const childArray = React.Children.toArray(children);

  return (
    <Component className={className} {...props}>
      {childArray.map((child, index) => (
        <ScrollReveal
          key={index}
          variant={variant}
          delay={baseDelay + index * stagger}
          duration={duration}
          distance={distance}
        >
          {child}
        </ScrollReveal>
      ))}
    </Component>
  );
}
