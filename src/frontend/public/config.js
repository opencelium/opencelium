// Runtime configuration, loaded via a plain <script> tag before the app bundle
// (see index.html). Edit this file directly in the deployed dist/ output to
// point the SPA at a different backend/websocket host — no rebuild needed.
window.__OC_CONFIG__ = {
  API_URL: 'http://localhost:9090',
  SOCKET_URL: 'http://localhost:9090/ws',
};
