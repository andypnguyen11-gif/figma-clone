/**
 * Normalizes dashboard "Join" input: users may paste either the bare
 * share_token or a full invite URL from GET /api/canvas/:id/share.
 * The API path is /api/canvas/join/:token — only the token segment must be sent.
 */

export function parseShareTokenFromInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const joinMatch = trimmed.match(/\/join\/([^/?#]+)/);
  if (joinMatch) {
    try {
      return decodeURIComponent(joinMatch[1]);
    } catch {
      return joinMatch[1];
    }
  }

  return trimmed;
}
