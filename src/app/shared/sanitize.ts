// Strip tags and normalize whitespace on free-text user input before
// it is stored, so Firestore never holds raw markup.
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>"'`]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}
