import { useEffect, useRef } from 'react';

export function useScrollSync<T extends HTMLElement, U extends HTMLElement>(
  leftRef: React.RefObject<T>,
  rightRef: React.RefObject<U>,
) {
  const isSyncing = useRef(false);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;

    if (!left || !right) {
      return;
    }

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      if (isSyncing.current) {
        return;
      }
      isSyncing.current = true;
      target.scrollTop = source.scrollTop;
      target.scrollLeft = source.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    const handleLeft = () => syncScroll(left, right);
    const handleRight = () => syncScroll(right, left);

    left.addEventListener('scroll', handleLeft, { passive: true });
    right.addEventListener('scroll', handleRight, { passive: true });

    return () => {
      left.removeEventListener('scroll', handleLeft);
      right.removeEventListener('scroll', handleRight);
    };
  }, [leftRef, rightRef]);
}
