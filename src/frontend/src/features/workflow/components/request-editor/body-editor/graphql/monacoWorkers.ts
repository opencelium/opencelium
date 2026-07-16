// Registers globalThis.MonacoEnvironment.getWorker so Vite bundles Monaco's JSON/GraphQL/editor
// web workers correctly (autocomplete on Ctrl+Space, inline diagnostics depend on this).
//
// This mirrors graphiql's own `graphiql/setup-workers/vite` helper, but lives in our own source
// instead of being imported from node_modules. The `?worker` suffix below is a Vite-only import
// convention understood by Vite's dev-transform pipeline for files it serves directly — it is
// NOT understood by esbuild's dependency pre-bundling pass, which node_modules packages go
// through. Importing graphiql's own helper pulled `monaco-editor`/`monaco-graphql` into that
// pre-bundle pass and broke ("Cannot read file: ...editor.worker.js?worker"); keeping these
// imports in first-party source avoids that entirely, so nothing needs excluding from
// optimizeDeps (which would otherwise also break CJS interop for graphiql's other dependencies,
// e.g. react-compiler-runtime).
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker.js?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';

// monaco-editor's ambient types declare `MonacoEnvironment` as a bare global `let` binding —
// that's a type-only declaration, not a real runtime variable, so assigning to the bare
// identifier throws "MonacoEnvironment is not defined" in strict-mode ES modules. `window` is
// the actual global object in the browser and is where monaco-editor/monaco-graphql read it
// from, and it's also typed via monaco's `interface Window { MonacoEnvironment?: ... }`.
window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'graphql':
        return new GraphQLWorker();
      default:
        return new EditorWorker();
    }
  },
};
