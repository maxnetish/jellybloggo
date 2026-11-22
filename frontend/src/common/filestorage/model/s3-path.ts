/**
 * Returns the last non-empty segment of an S3 prefix or object key.
 * Example: "photos/vacation/" → "vacation"
 *          "photos/vacation/image.jpg" → "image.jpg"
 *          "" → ""
 */
export function lastSegmentOf(path: string): string {
  return path.replace(/\/+$/, '').split('/').pop() ?? '';
}

/**
 * Returns the last segments of directories and files, i.e. the names
 * that can collide inside a single S3 prefix.
 */
export function collectExistingNames(
  directories: Array<{ prefix: string }>,
  files: Array<{ key: string }>,
): ReadonlySet<string> {
  const names = new Set<string>();

  for (const dir of directories) {
    names.add(lastSegmentOf(dir.prefix));
  }
  for (const file of files) {
    names.add(lastSegmentOf(file.key));
  }

  return names;
}
