/**
 * Convenience re-export — sharing endpoints live on canvasApi
 * (getShareInfo, joinByToken). This module exists to satisfy the
 * project structure convention. Import from canvasApi directly.
 */
export { canvasApi as shareApi } from "./canvasApi.ts";
