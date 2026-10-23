/** Split a URL path into non-empty segments; `\` counts as `/` like the WHATWG URL parser. */
export function splitPath(path: string): string[] {
  return path.split(/[\\/]/).filter(Boolean);
}
