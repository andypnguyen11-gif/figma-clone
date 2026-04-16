/**
 * Pure helpers for reconciling local element state with the server during
 * debounced persist (detect rows to DELETE after local removes).
 */
export function idsRemovedFromCanvas(
  persistedIds: ReadonlySet<string>,
  currentIds: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const id of persistedIds) {
    if (!currentIds.has(id)) {
      out.push(id);
    }
  }
  return out;
}
