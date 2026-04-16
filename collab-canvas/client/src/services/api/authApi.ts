/**
 * REST client for authentication endpoints (POST /api/auth/*).
 *
 * Converts frontend camelCase ↔ backend snake_case at this boundary
 * so the rest of the client never sees snake_case keys.
 */
import { handleErrorResponse } from "./client.ts";

const BASE = "/api/auth";

export interface SignupParams {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  id: string;
  email: string;
  display_name: string;
  access_token: string;
  token_type: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  display_name: string;
}

export const authApi = {
  async signup(params: SignupParams): Promise<AuthResponseDTO> {
    const res = await fetch(`${BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        display_name: params.displayName,
      }),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async login(params: LoginParams): Promise<AuthResponseDTO> {
    const res = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
      }),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async getMe(token: string): Promise<UserResponseDTO> {
    const res = await fetch(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },
};
