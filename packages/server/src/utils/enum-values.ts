export function numericEnumValues<T extends Record<string, string | number>>(
  e: T
): number[] {
  return Object.values(e).filter((v): v is number => typeof v === 'number')
}
