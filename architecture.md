flowchart TD

%% =========================
%% CLIENT
%% =========================
subgraph CLIENT["Client (React + TypeScript + Konva)"]

    %% Core UI Structure
    Pages[Pages .tsx]
    Toolbar[Toolbar.tsx]
    AuthForms[LoginForm + SignupForm]
    CanvasViewport[CanvasViewport.tsx — react-konva Stage]
    KonvaShapes[KonvaShapes.tsx — Shape Renderers]
    SelectionOverlay[SelectionOverlay.tsx]
    InlineTextEditor[InlineTextEditor.tsx]
    LockOverlay[LockOverlay.tsx]
    PropertyPanel[PropertyPanel.tsx]
    PresenceLayer[PresenceLayer.tsx]

    %% State
    subgraph CLIENT_STATE["State"]
        Zustand[Zustand Store]
        UndoRedo[Undo/Redo Stack]
        LocalState[Local State + Refs]
    end

    %% Services
    subgraph CLIENT_SERVICES["Services"]
        APIClient[REST API Client]
        WSClient[WebSocket Client — JWT]
        DebouncedPersist[Debounced REST persist — element edits]
        Reconnect[Reconnect + REST resync + WS lock:snapshot]
        LockClient[Lock Manager]
    end

    %% Types & Utils
    subgraph CLIENT_TYPES["Frontend Types & Utils"]
        Types[types/*.ts]
        Utils[utils/*.ts]
    end

    %% Composition
    Pages --> AuthForms
    Pages --> Toolbar
    Pages --> CanvasViewport
    Pages --> PropertyPanel

    CanvasViewport --> KonvaShapes
    CanvasViewport --> SelectionOverlay
    CanvasViewport --> InlineTextEditor
    CanvasViewport --> LockOverlay
    CanvasViewport --> PresenceLayer

    %% State usage
    CanvasViewport --> Zustand
    PropertyPanel --> Zustand
    PresenceLayer --> Zustand
    LockOverlay --> Zustand

    Zustand --> UndoRedo

    %% Local interactions
    CanvasViewport --> LocalState

    %% Services usage
    Zustand --> APIClient
    Zustand --> WSClient
    Zustand --> LockClient

    DebouncedPersist --> APIClient
    Reconnect --> WSClient
    Reconnect --> APIClient

    LockClient --> WSClient

    %% Types
    KonvaShapes --> Utils
    Pages --> Types
end

%% =========================
%% SERVER
%% =========================
subgraph SERVER["Backend (FastAPI + Python)"]

    %% API
    subgraph API["REST API"]
        AuthRoute[auth.py]
        CanvasRoute[canvas.py]
        ElementsRoute[elements.py]
        ShareRoute[share.py]
    end

    %% Services
    subgraph SERVICES["Services"]
        AuthService[auth_service.py]
        CanvasService[canvas_service.py]
        ElementService[element_service.py]
        RealtimeService[realtime_sync_service.py]
        LockService[lock_service.py]
    end

    %% WebSocket
    subgraph WS_LAYER["WebSocket Layer"]
        WSRouter[router.py]
        WSAuth[JWT Auth]
        WSManager[connection manager]
        WSEvents[event handlers]
    end

    %% Core
    subgraph CORE["Core"]
        Config[config.py]
        Security[security.py]
        DBSession[db session]
    end

    %% Schemas
    subgraph SCHEMAS["Schemas"]
        AuthSchema[auth schema]
        CanvasSchema[canvas schema]
        ElementSchema[element schema]
    end

    %% API flow
    AuthRoute --> AuthService
    CanvasRoute --> CanvasService
    ElementsRoute --> ElementService
    ShareRoute --> CanvasService

    %% Schema usage
    AuthRoute --> AuthSchema
    CanvasRoute --> CanvasSchema
    ElementsRoute --> ElementSchema

    %% Core usage
    AuthService --> Security
    AuthService --> DBSession
    CanvasService --> DBSession
    ElementService --> DBSession

    %% WebSocket flow
    WSRouter --> WSAuth
    WSAuth --> Security
    WSRouter --> WSManager
    WSRouter --> WSEvents

    WSEvents --> RealtimeService
    WSEvents --> LockService
end

%% =========================
%% DATABASE
%% =========================
subgraph POSTGRES["PostgreSQL"]
    Users[(users)]
    Canvases[(canvases)]
    Elements[(elements)]
end

Users --> Canvases
Canvases --> Elements

%% =========================
%% REDIS
%% =========================
subgraph REDIS["Redis"]
    Presence[(presence — TTL)]
    Locks[(locks — SETNX + TTL)]
    PubSub[(pub/sub)]
end

%% =========================
%% INTERACTIONS
%% =========================

%% HTTP
APIClient -->|HTTP| AuthRoute
APIClient -->|HTTP| CanvasRoute
APIClient -->|HTTP| ElementsRoute
APIClient -->|HTTP| ShareRoute

%% WebSocket
WSClient -->|WS + JWT| WSRouter
WSManager -->|broadcast| WSClient

%% DB persistence
AuthService --> Users
CanvasService --> Canvases
ElementService --> Elements

%% Realtime
RealtimeService --> PubSub
PubSub --> WSManager

%% Presence
WSManager --> Presence
Presence --> WSManager

%% Locking
LockService --> Locks
Locks --> LockService
ElementService --> LockService

%% =========================
%% RESPONSIBILITY NOTES
%% =========================

LocalState -.->|dragging, pointer, hover| CanvasViewport
Zustand -.->|canvas state, elements, auth, presence, locks, undo/redo| Pages
PropertyPanel -.->|edit properties| Zustand
LockClient -.->|acquire/release/heartbeat| WSClient
LockOverlay -.->|visual lock indicators| CanvasViewport