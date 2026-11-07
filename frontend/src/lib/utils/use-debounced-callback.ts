'use client';

import { useRef, useCallback } from 'react';

/**
 * Creates a debounced version of the provided callback.
 * The returned function maintains a stable reference across renders.
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced function with the same signature as the callback
 */
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
}