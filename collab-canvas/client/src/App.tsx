/**
 * App shell — renders the router which handles auth gating,
 * page-level data fetching, and the canvas editor.
 */
import { AppRouter } from "./app/router/index.tsx";

function App() {
  return <AppRouter />;
}

export default App;
