/**
 * Returns the last non-empty segment of an S3 prefix or object key.
 * Example: "photos/vacation/" → "vacation"
 *          "photos/vacation/image.jpg" → "image.jpg"
 *          "" → ""
 */
export function lastSegmentOf(path: string): string {
  return path.replace(/\/+$/, '').split('/').pop() ?? '';
}
