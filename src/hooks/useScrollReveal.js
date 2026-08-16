import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for detecting when an element is scrolled into view.
 * @param {Object} options IntersectionObserver options & configuration
 * @param {number} [options.threshold=0.12] Visibility ratio required to trigger
 * @param {string} [options.rootMargin='0px 0px -40px 0px'] Root margin offset
 * @param {boolean} [options.once=true] Whether to animate only once or re-trigger
 * @returns {[React.RefObject, boolean]} [ref, isVisible]
 */
export function useScrollReveal({
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  once = true,
} = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect user's motion preferences
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
}
