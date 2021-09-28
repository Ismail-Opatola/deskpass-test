/**
 * Note
 * ----
 * This Proxy is an intermediary application.
 * It sits between client and the two backend services: books and authors.
 * It processes/modifies the requests and responses in both directions.
 *
 * Uses cases
 * Authorization - Forward only authorized requests to access a service.
 * Load balancing - Distribute inbound requests traffic equally among instances.
 * Logging - Log every requests going to a Back End API service.
 */

// Imports
const express = require("express"),
  morgan = require("morgan"),
  { createProxyMiddleware } = require("http-proxy-middleware");

// -------------
// Create Express Server
// -------------
const app = express();

// -------------
// Configuration
// -------------
const PORT = 8000, HOST = "localhost";
const API_SERVICE_URLS = {
    authors: "http://localhost:8002",
    books: "http://localhost:8001",
  };

const SUPPORTED_HTTP_METHODS = ['GET'];

/**
 * Logging:
 * ---
 * Logs the incoming requests.
 */
app.use(morgan("dev"));

/**
 * Authorization: authorization/permission handling middleware.
 * ---
 * Sends 403 (Forbidden) if the Authorization Header is missing.
 */
app.use("", (req, res, next) => {
  if (req.headers.authorization) {
    next();
  } else {
    res.sendStatus(403);
  }
});

/**
 * Allow only supported methods
 */
app.use("", (req, res, next) => {
  if(SUPPORTED_HTTP_METHODS.includes(req.method)) {
    next();
  } else {
    res.sendStatus(400);
  }
})

// ---------------
// Proxy endpoints
// ---------------

/**
 * Proxy all requests starting with "/books" to the books-server. 
 * Define a pathRewrite so that /books is omitted when forwarded to the books API
 * Ensure the books server is live.
 */
app.use(
  "/books",
  createProxyMiddleware({
    target: API_SERVICE_URLS.books,
    changeOrigin: true,
    pathRewrite: {
      [`^/books`]: "",
    },
  })
);

/**
 * Proxy all requests starting with "/authors" to the authors-server. 
 * Define a pathRewrite so that /authors is omitted when forwarded to the authors API
 * Ensure the authors server is live.
 */

app.use(
  "/authors",
  createProxyMiddleware({
    target: API_SERVICE_URLS.authors,
    changeOrigin: true,
    pathRewrite: {
      [`^/authors`]: "",
    },
  })
);

/**
 * Info GET endpoint
 * ---
 * @returns text response information about the proxy server
 */
app.get("/info", (req, res, next) => {
  res.send("This is a proxy service which proxies to Books and Authors APIs.");
});

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Proxy server is running on http://${HOST}:${PORT}`);
});
