/**
 * Shared HTTP helpers for the REST API layer.
 *
 * All API modules use these to build requests and handle errors uniformly.
 * The base URL is empty because Vite's dev proxy forwards /api to the backend.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Parse a non-ok response into an ApiError.
 * Tries to read `detail` from the JSON body (FastAPI convention),
 * falling back to the HTTP status text.
 */
export async function handleErrorResponse(res: Response): Promise<never> {
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (typeof body.detail === "string") {
      message = body.detail;
    }
  } catch {
    /* body isn't JSON — use the fallback message */
  }
  throw new ApiError(message, res.status);
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function jsonAuthHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
