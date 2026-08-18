import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// Import the specifically compiled graphiql worker entry point
import GraphQLWorker from 'graphiql/esm/workers/graphql.worker?worker';

globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
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
