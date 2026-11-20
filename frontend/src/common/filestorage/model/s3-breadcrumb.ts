/**
 * Сегмент навигационной цепочки (breadcrumbs) внутри S3-бакета.
 */
export interface S3Breadcrumb {
  /** Текст сегмента: 'Root' для корня, иначе имя папки. */
  label: string;
  /** S3-префикс для store.choosePrefix. У корня — ''. */
  prefix: string;
}
