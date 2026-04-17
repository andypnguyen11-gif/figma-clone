🧩 Product Requirements Document (PRD)
Product: Collab Canvas (Figma Clone - MVP)

1. User Stories
👤 Primary User: Designer / Creator (PRIORITY)
This is the first user to optimize for. If this flow isn't solid, the product fails.
Authentication & Identity
* As a designer, I want to create an account and log in so that my work is associated with my identity
Canvas & Navigation
* As a designer, I want to see a large canvas workspace so that I have room to design
* As a designer, I want to pan and zoom the canvas smoothly so that I can navigate my design space
Sharing & Access
* As a designer, I want to generate a shareable URL for my canvas so that I can invite collaborators to join
* All participants who join via the shared URL have full edit access (no role-based permissions in MVP)
Creation & Editing
* As a designer, I want to create basic shapes (rectangles, circles, lines, triangles, and text) so that I can build simple designs
* As a designer, I want to move objects around the canvas so that I can arrange my design
* As a designer, I want to resize elements so that I can adjust my layout
* As a designer, I want to delete elements from the canvas so that I can remove unwanted objects
Element Properties
* As a designer, I want to select an element and view/edit its properties (fill color, stroke color, stroke width, opacity, rotation, z-index) so that I can customize my design
* As a designer, I want to type directly into a text element on the canvas so that text editing feels natural and inline
* As a designer, I want to configure font size and text color on text elements so that I can style my text
Undo / Redo
* As a designer, I want to undo and redo my actions so that I can correct mistakes easily
Keyboard Shortcuts
* As a designer, I want to use keyboard shortcuts for common actions (undo, redo, delete, tool selection) so that I can work efficiently
Collaboration Awareness
* As a designer, I want to see other users' cursors with their names so that I know who is working where
* As a designer, I want to see who else is currently online so that I know who I'm collaborating with
Real-Time Collaboration
* As a designer, I want to see changes made by other users in real time so that we can collaborate seamlessly
* As a designer, I want changes to happen without conflicts so that multiple people can work simultaneously
* As a designer, I want to see which elements other users are currently editing (locked) so that I don't attempt conflicting edits
* As a designer, I want locked elements to be visually indicated (outline + owner name) so that collaboration is transparent
Persistence
* As a designer, I want my edits persisted to the server after changes settle (debounced) so that I don't lose progress

👥 Secondary User: Collaborator
Joining & Context
* As a collaborator, I want to join an existing canvas via a shared URL so that I can start editing immediately
* As a collaborator, I want to see all existing objects when I join so that I have full context
Editing & Collaboration
* As a collaborator, I want full edit access to the canvas so that I can contribute without restrictions
* As a collaborator, I want to make changes without conflicts so that multiple people can work simultaneously
* As a collaborator, I want to see which elements are locked by other users so that I know what I can and cannot edit
* As a collaborator, I want to see updates in real time so that collaboration feels instant

2. Key Features for MVP
✅ INCLUDED (MVP Scope)
🖼️ Canvas Workspace
* Single infinite canvas
* Pan + zoom support
* Basic coordinate system
🔺 Shape Creation & Editing
* Rectangle tool
* Circle tool
* Line tool
* Triangle tool
* Text tool (inline editing — click to type directly on canvas)
* Drag-and-drop placement
* Resize via handles
* Move via drag
* Delete element
🎨 Element Properties Panel
* Fill color
* Stroke color
* Stroke width
* Opacity
* Rotation
* Z-index layering (bring forward / send backward)
* Text-specific: font size, text color
📝 Selection & Locking
* Click to select an element
* Selection enables: move, resize, and property editing
* No multi-select or grouping in MVP
* Selecting an element acquires an exclusive lock — other users cannot select or edit it while locked
* Locked elements display a colored outline and the lock owner's name
* Lock is released when the user deselects, switches tools, or disconnects
* Locks are stored in Redis with a TTL (auto-expire if the client crashes without releasing)
↩️ Undo / Redo
* Action history stack
* Undo/redo via toolbar buttons and keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
⌨️ Keyboard Shortcuts
* Delete/Backspace — delete selected element
* Ctrl/Cmd+Z — undo
* Ctrl/Cmd+Shift+Z — redo
* Tool shortcuts (e.g., R for rectangle, C for circle, L for line, T for text, V for select)
🔐 Authentication
* User signup/login via Python API
* JWT-based authentication
🔗 Sharing
* Generate shareable canvas URL
* Any user with the URL can join and edit (full access, no roles)
👥 Real-Time Collaboration
* Multiple users in same canvas
* Live cursor presence
* User cursor identifiers (name/color)
* Online user presence tracking
🔄 Real-Time Synchronization
* WebSocket-based real-time updates (authenticated connections)
* Broadcast element changes to all connected clients
* Conflict handling: element-level locking (only the lock holder can mutate an element)
* Server rejects mutations from non-lock-holders (guard on both REST and WebSocket paths)
* Reconnection with canvas state refresh on disconnect/reconnect; current lock state is delivered via WebSocket (`lock:snapshot` after connect), not a separate REST lock endpoint
💾 Persistence
* Store canvas and elements in PostgreSQL
* Debounced persistence to the API after local element changes settle (avoids spamming the server on every drag frame; not a timed interval)
* Page reload restores latest saved state

3. Tech Stack (FINAL)
Frontend
* React (TypeScript)
* Konva (react-konva) — canvas rendering engine
State Management
* Zustand (global client-side state)
    * Stores:
        * elements
        * selected tool
        * selected element
        * canvas metadata
        * authenticated user
        * undo/redo history
        * element locks (active lock owners)
* Local component state / refs:
    * drag interactions
    * cursor movement
    * hover state

Backend / API Layer
* Python (FastAPI)
Responsibilities:
* Authentication (JWT issuance/validation)
* Canvas CRUD operations
* Element CRUD operations
* Session management
* WebSocket handling (authenticated)

Real-Time Layer
* FastAPI WebSockets (authenticated via JWT)
Responsibilities:
* Handle canvas session connections
* Broadcast updates
* Manage active users
* Handle reconnection and state refresh

Database Layer
PostgreSQL
* Persistent storage:
    * users
    * canvases
    * elements
Redis
* Real-time data:
    * user presence
    * pub/sub for event distribution
    * ephemeral cursor positions
    * element locks (SETNX + TTL)

Backend Technologies
* FastAPI
* Uvicorn
* Pydantic
* SQLAlchemy (or SQLModel)
* Redis

4. Example API Design
Auth

POST /auth/signup
POST /auth/login

Canvas

GET    /canvas/:id
POST   /canvas
PATCH  /canvas/:id

Sharing

GET    /canvas/:id/share    → returns shareable URL / join token

Elements

POST   /canvas/:id/elements
PATCH  /canvas/:id/elements/:elementId
DELETE /canvas/:id/elements/:elementId

WebSocket

WS /canvas/:id/ws?token=<JWT>


5. Out of Scope (MVP)
* AI-powered features
* Multi-canvas dashboards
* File/folder organization
* Multi-select / grouping
* Advanced vector tools
* Components / design systems
* Comments
* Version history (beyond undo/redo session history)
* Offline mode
* Role-based permissions (all participants have full edit access)
* Export / download

6. Pitfalls & Considerations
🔴 Real-Time Sync Complexity
* Ordering issues
* Race conditions
* Duplicate events
* Lock acquisition races (two users selecting the same element at the same instant — Redis atomic SETNX resolves this)
* Stale locks if a client crashes — TTL-based expiry + server-side cleanup on disconnect

🔴 Backend Complexity
* WebSocket + Redis adds overhead
* Requires careful architecture

🔴 Canvas Performance
* Konva handles rendering efficiently, but avoid unnecessary re-renders
* Use Konva layers to separate static vs. dynamic content

🔴 State Management
* Avoid putting high-frequency updates in Zustand
* Keep a single source of truth
* Undo/redo stack must stay in sync with persisted state

🟡 Cursor Presence
* Use Redis (not database)
* Throttle cursor position updates (~50ms) to avoid flooding
* Expire stale presence keys with TTL

🟡 Text Rendering
* Konva supports inline text editing natively
* Needs special handling for focus/blur and keyboard events

🟡 Element Locking
* Use Redis SETNX for atomic lock acquisition (prevents race conditions)
* Lock value stores user ID + timestamp
* TTL of ~30 seconds, refreshed by heartbeat while element remains selected
* On disconnect, server releases all locks held by that user
* Frontend must handle lock-denied gracefully (element visually bounces back to unselected state)

🟡 Database Design
* Avoid full canvas rewrites
* Use granular element updates

🟡 WebSocket Reconnection
* Detect disconnects and auto-reconnect with backoff
* On reconnect, re-authenticate (JWT on the new WebSocket) and fetch latest canvas + elements via REST to re-sync local stores
* After connect, the server sends `lock:snapshot` (Redis-backed locks for the canvas) so the client’s lock overlay matches reality without a dedicated locks REST API
* Optionally clear stale lock/presence overlays while the socket is down; the server releases a disconnected user’s locks in Redis

7. Suggested Build Order
1. Canvas rendering with Konva (local only)
2. Shape tools (rect, circle, line, triangle, text with inline editing)
3. Drag/move/resize interactions
4. Element properties panel (fill, stroke, opacity, rotation, z-index)
5. Selection + delete
6. Undo/redo
7. Keyboard shortcuts
8. Zustand store implementation
9. Backend API (auth + CRUD)
10. PostgreSQL integration
11. Frontend ↔ API connection (including debounced persist of element changes)
12. WebSocket server (authenticated)
13. Redis integration
14. Real-time sync
15. Cursor presence
16. Reconnection + state refresh
👉 Build real-time LAST.

8. Final Engineering Take
This project now represents:
* Frontend system (Konva canvas engine with property editing)
* Backend API (FastAPI)
* Real-time system (authenticated WebSockets + Redis)
* State architecture (Zustand + undo/redo + local state separation)
