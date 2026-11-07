/**
 * Creates a debounced version of the provided callback.
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns A function with the same signature as the callback
 */
export function debounce<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}