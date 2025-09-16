import { useEffect, useRef } from 'react';

export function useScrollPosition() {
  const scrollPositionRef = useRef<number>(0);

  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY;
  };

  const restoreScrollPosition = () => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'auto'
      });
    });
  };

  return {
    saveScrollPosition,
    restoreScrollPosition
  };
}