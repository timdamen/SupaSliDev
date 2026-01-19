export function emptyArray<T>(length: number) {
  return Array.from<T>({ length })
}
