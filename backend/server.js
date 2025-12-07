// Delegate to the centralized app in `src/app.js` which configures
// middleware, routes and starts the server. This avoids duplicate
// requires and fixes relative path issues for controllers.

require("./src/app");
