import { useState, useEffect } from 'react';

/**
 * VacanSee - Ease-Out Animated Counter Custom Hook
 * 
 * Animates a numerical counter smoothly from 0 to targetValue using a cubic
 * ease-out formula (1 - (1 - progress)^3) over 1400ms, matching the original
 * VacanSee landing page animation.
 * 
 * Cleans up requestAnimationFrame on unmount or value change to prevent memory leaks.
 * 
 * @param {number} targetValue Target number to count up to (e.g. 50, 10, 380, 1450)
 * @param {number} [duration=1400] Animation duration in milliseconds
 * @param {boolean} [start=true] Whether the animation should run
 * @returns {{ count: number, formattedCount: string }}
 */
export function useCountUp(targetValue, duration = 1400, start = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    const target = parseInt(targetValue, 10) || 0;
    if (target === 0) {
      setCount(0);
      return;
    }

    let animationFrameId;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Cubic ease-out: starts fast, smoothly decelerates toward target
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(target * easeOut);

      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    }

    animationFrameId = requestAnimationFrame(step);

    // Cancel animation frame on cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetValue, duration, start]);

  return count;
}

