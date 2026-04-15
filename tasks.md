🧩 Collab Canvas — Final PR-Based Task List (Aligned with PRD)

📁 File Structure (Final)

collab-canvas/
├─ client/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ providers/
│  │  │  │  └─ AuthProvider.tsx
│  │  │  ├─ router/
│  │  │  │  └─ index.tsx
│  │
│  │  ├─ components/
│  │  │  ├─ canvas/
│  │  │  │  ├─ CanvasViewport.tsx       ← react-konva Stage, pan/zoom
│  │  │  │  ├─ KonvaShapes.tsx          ← shape renderers (Rect, Circle, Line, etc.)
│  │  │  │  ├─ SelectionOverlay.tsx     ← selection handles, resize anchors
│  │  │  │  ├─ InlineTextEditor.tsx     ← click-to-type text editing on canvas
│  │  │  │  ├─ interactionHandlers.ts
│  │  │
│  │  │  ├─ toolbar/
│  │  │  │  └─ Toolbar.tsx
│  │  │
│  │  │  ├─ properties/
│  │  │  │  └─ PropertyPanel.tsx        ← fill, stroke, opacity, rotation, z-index
│  │  │
│  │  │  ├─ presence/
│  │  │  │  └─ PresenceLayer.tsx
│  │  │
│  │  │  ├─ locking/
│  │  │  │  └─ LockOverlay.tsx            ← colored outline + owner name on locked elements
│  │  │
│  │  │  ├─ auth/
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  └─ SignupForm.tsx
│  │
│  │  ├─ features/
│  │  │  ├─ canvas/
│  │  │  │  ├─ canvasStore.ts           ← Zustand
│  │  │  │  ├─ useCanvasData.ts
│  │  │
│  │  │  ├─ elements/
│  │  │  │  ├─ elementStore.ts          ← Zustand
│  │  │  │  ├─ useElementMutations.ts
│  │  │  │  ├─ realtimeHandlers.ts
│  │  │
│  │  │  ├─ auth/
│  │  │  │  ├─ authStore.ts             ← Zustand
│  │  │
│  │  │  ├─ presence/
│  │  │  │  ├─ presenceStore.ts         ← Zustand
│  │  │
│  │  │  ├─ locking/
│  │  │  │  ├─ lockStore.ts             ← Zustand (active locks map)
│  │  │  │  ├─ useLockManager.ts        ← acquire/release/heartbeat logic
│  │  │  │  ├─ lockHandlers.ts          ← WS event handlers for lock events
│  │  │
│  │  │  ├─ history/
│  │  │  │  ├─ historyStore.ts          ← Zustand (undo/redo stack)
│  │  │  │  ├─ useUndoRedo.ts
│  │
│  │  ├─ hooks/
│  │  │  ├─ useKeyboardShortcuts.ts
│  │  │  ├─ useAutoSave.ts             ← 10-minute interval timer
│  │  │  ├─ useReconnect.ts            ← WebSocket reconnection + state refresh
│  │
│  │  ├─ services/
│  │  │  ├─ api/
│  │  │  │  ├─ authApi.ts
│  │  │  │  ├─ canvasApi.ts
│  │  │  │  ├─ elementsApi.ts
│  │  │  │  ├─ shareApi.ts
│  │  │
│  │  │  ├─ websocket/
│  │  │  │  ├─ canvasSocket.ts          ← authenticated WS connection
│  │
│  │  ├─ pages/
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ SignupPage.tsx
│  │  │  ├─ CanvasPage.tsx
│  │
│  │  ├─ types/
│  │  │  ├─ canvas.ts
│  │  │  ├─ element.ts                  ← includes fill, stroke, strokeWidth, opacity, rotation, zIndex
│  │  │  ├─ websocket.ts                ← includes lock:acquire, lock:release, lock:denied, lock:heartbeat events
│  │
│  │  ├─ utils/
│  │  │  ├─ geometry.ts
│  │  │  ├─ canvas.ts
│  │
│  │  ├─ main.tsx
│
├─ server/
│  ├─ app/
│  │  ├─ api/routes/
│  │  │  ├─ auth.py
│  │  │  ├─ canvas.py
│  │  │  ├─ elements.py
│  │  │  ├─ share.py
│  │
│  │  ├─ core/
│  │  │  ├─ config.py
│  │  │  ├─ security.py
│  │
│  │  ├─ db/
│  │  │  ├─ session.py
│  │  │  ├─ base.py
│  │
│  │  ├─ models/
│  │  │  ├─ user.py
│  │  │  ├─ canvas.py
│  │  │  ├─ element.py
│  │
│  │  ├─ schemas/
│  │  │  ├─ auth.py
│  │  │  ├─ canvas.py
│  │  │  ├─ element.py                  ← includes fill, stroke, strokeWidth, opacity, rotation, zIndex
│  │
│  │  ├─ services/
│  │  │  ├─ auth_service.py
│  │  │  ├─ canvas_service.py
│  │  │  ├─ element_service.py
│  │  │  ├─ realtime_sync_service.py
│  │  │  ├─ lock_service.py             ← acquire/release/heartbeat via Redis SETNX + TTL
│  │
│  │  ├─ websocket/
│  │  │  ├─ manager.py
│  │  │  ├─ events.py
│  │  │  ├─ router.py
│  │  │  ├─ ws_auth.py                  ← JWT validation on WebSocket connect
│  │
│  │  ├─ redis/
│  │  │  ├─ client.py
│  │  │  ├─ presence.py
│  │  │  ├─ locks.py                    ← Redis SETNX/DEL/EXPIRE helpers for element locks
│  │
│  │  ├─ tests/
│  │  │  ├─ test_auth.py
│  │  │  ├─ test_canvas.py
│  │  │  ├─ test_elements.py
│  │  │  ├─ test_websocket.py
│  │  │  ├─ test_share.py
│  │  │  ├─ test_locking.py
│
├─ docker-compose.yml


🚀 PR BREAKDOWN

PR-01 — Project Setup
Tasks
* Setup React + TypeScript + Konva (react-konva)
* Setup FastAPI backend
* Setup PostgreSQL + Redis (Docker)
* Configure env files
Files
* client/main.tsx
* server/main.py
* docker-compose.yml
Tests
* Backend health route test
* Frontend render test

PR-02 — Database + Models
Tasks
* Create models:
    * user.py
    * canvas.py
    * element.py (includes: fill, stroke, strokeWidth, opacity, rotation, zIndex fields)
* Setup migrations
* Add indexes
Tests

pytest server/app/tests/test_models.py


PR-03 — Auth System
Tasks
* JWT auth (security.py)
* Signup/login endpoints
* Password hashing
Tests

pytest server/app/tests/test_auth.py


PR-04 — Canvas API + Sharing
Tasks
* Create/get/update canvas
* Share endpoint — generate shareable URL / join token
* Any user with URL has full edit access (no role checks)
Files
* canvas.py
* canvas_service.py
* share.py
Tests

pytest server/app/tests/test_canvas.py
pytest server/app/tests/test_share.py


PR-05 — Elements API
Tasks
* CRUD elements (create, read, update, delete)
* Support types:
    * rectangle
    * circle
    * line
    * triangle
    * text
* Element schema includes: fill, stroke, strokeWidth, opacity, rotation, zIndex
* Text elements include: fontSize, textColor
* Guard element update/delete endpoints — reject if caller does not hold the element lock (returns 423 Locked)
Tests

pytest server/app/tests/test_elements.py


PR-06 — Zustand Stores
Tasks
* Create stores:
    * canvasStore.ts
    * elementStore.ts
    * authStore.ts
    * presenceStore.ts
    * historyStore.ts (undo/redo)
    * lockStore.ts (active element locks map: elementId → { userId, userName, color })
State Includes
* elements (with full property set)
* selectedTool
* selectedElementId
* user
* canvas metadata
* undoStack / redoStack
* locks (Map of elementId → lock owner info)

PR-07 — Canvas Engine (Konva, Local)
Tasks
* Canvas rendering with react-konva Stage/Layer
* KonvaShapes.tsx — render Rect, Circle, Line, RegularPolygon (triangle), Text
* Viewport pan/zoom (Stage draggable + scale)
* Geometry helpers
Tests

npm run test -- canvas


PR-08 — Shape Tools + Selection
Tasks
* Toolbar with tool selection
* Shape creation on canvas click/drag
* Click to select element → sends lock:acquire via WebSocket
* If lock:denied is received, cancel selection (element remains unselected, show brief toast/indicator)
* Move via drag (Konva Transformer or manual) — only allowed if lock is held
* Resize via handles — only allowed if lock is held
* Deselect / switch tool → sends lock:release via WebSocket
* Text tool — inline editing (click text to type directly on canvas)
* Font size and text color configurable via property panel
* LockOverlay.tsx — render colored outline + owner name on elements locked by other users
Tests

npm run test -- elements


PR-09 — Property Panel
Tasks
* PropertyPanel.tsx — displays when an element is selected
* Editable fields:
    * Fill color (color picker)
    * Stroke color (color picker)
    * Stroke width (number input)
    * Opacity (slider, 0–1)
    * Rotation (number input, degrees)
    * Z-index (bring forward / send backward buttons)
* Text-specific fields: font size, text color
* Updates element in Zustand store on change
Tests

npm run test -- properties


PR-10 — Delete + Undo/Redo
Tasks
* Delete selected element (Delete/Backspace key + toolbar button)
* Undo/redo history stack in historyStore.ts
* Push state snapshots on: create, move, resize, delete, property change
* Undo: Ctrl/Cmd+Z
* Redo: Ctrl/Cmd+Shift+Z
* Toolbar undo/redo buttons
Tests

npm run test -- history


PR-11 — Keyboard Shortcuts
Tasks
* useKeyboardShortcuts.ts hook
* Shortcuts:
    * Delete/Backspace — delete selected
    * Ctrl/Cmd+Z — undo
    * Ctrl/Cmd+Shift+Z — redo
    * V — select tool
    * R — rectangle tool
    * C — circle tool
    * L — line tool
    * T — text tool
Tests

npm run test -- shortcuts


PR-12 — API Integration + Auto-Save
Tasks
* Fetch canvas + elements on page load
* Connect Zustand stores to REST API
* Auto-save timer: persist canvas state every 10 minutes while user is active on the page
* useAutoSave.ts hook (setInterval, resets on page visibility change)
Tests

npm run test -- api-integration


PR-13 — WebSocket Server (Authenticated)
Tasks
* WebSocket endpoint: WS /canvas/:id/ws?token=<JWT>
* JWT validation on connect (ws_auth.py)
* Reject unauthenticated connections
* Connection manager (manager.py)
Tests

pytest server/app/tests/test_websocket.py


PR-14 — Real-Time Sync + Element Locking
Tasks
* Broadcast element create/update/delete to all connected clients
* Merge incoming updates into local Zustand state
* Handle duplicate events
* Element locking system (replaces last-write-wins):
    * lock_service.py — acquire (Redis SETNX), release (DEL), heartbeat (EXPIRE refresh)
    * redis/locks.py — low-level Redis helpers for lock keys (lock:canvas:{canvasId}:element:{elementId})
    * WebSocket events: lock:acquire, lock:release, lock:denied, lock:heartbeat
    * Server broadcasts lock:acquire/lock:release to all clients in the canvas room
    * Server rejects element mutations from clients who do not hold the lock (returns error event)
    * On client disconnect, server releases all locks held by that user and broadcasts lock:release
    * Lock TTL: 30 seconds, refreshed by periodic heartbeat (~10s) from the client while element is selected
    * useLockManager.ts — hook that manages acquire/release lifecycle tied to selectedElementId
    * lockHandlers.ts — processes incoming lock WS events, updates lockStore
    * lockStore.ts — Zustand store: Map<elementId, { userId, userName, color }>
    * LockOverlay.tsx — renders visual lock indicators for elements locked by others
Tests

pytest server/app/tests/test_locking.py
npm run test -- locking

PR-15 — Cursor Presence (Redis)
Tasks
* Store cursor positions in Redis with TTL-based expiry
* Broadcast cursor positions via WebSocket
* Throttle outgoing cursor updates (~50ms)
* PresenceLayer.tsx — render remote cursors with name/color labels
* Expire stale presence keys automatically

PR-16 — Reconnection + State Refresh
Tasks
* Detect WebSocket disconnect
* Auto-reconnect with exponential backoff
* On reconnect: re-authenticate, fetch latest canvas state via REST API
* On reconnect: fetch current lock state and update lockStore (so locked elements are displayed correctly)
* Merge fetched state into local store
* Release any locally held locks before disconnect cleanup
* useReconnect.ts hook

🧪 Testing Rules (IMPORTANT)
* Tests must pass before moving forward
* DO NOT modify tests to pass
* Commands:
Backend:

pytest

Frontend:

npm run test
