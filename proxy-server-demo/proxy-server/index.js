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
const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const client = require("prom-client");

// ----------------------
// Create Express Server
// ----------------------
const app = express();

// -------------
// Configuration
// -------------
const PORT = 8000,
  HOST = "localhost";

const API_SERVICE_URLS = {
  authors: "http://localhost:8002",
  books: "http://localhost:8001",
};

const SUPPORTED_HTTP_METHODS = ["GET"];

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
  if (SUPPORTED_HTTP_METHODS.includes(req.method)) {
    next();
  } else {
    res.sendStatus(400);
  }
});

// -----------
// Prom Client
// -----------

// Creates a Registry which registers the metrics
const register = new client.Registry();

// Adds a default label which is added to all metrics
register.setDefaultLabels({
  app: "node-proxy-server",
});

// Enables the collection of default metrics
// client.collectDefaultMetrics({ register });

/**
 * httpRequestDurationMicroseconds -
 * This histogram metric measures request duration under 10 seconds
 */
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in microseconds",
  labelNames: ["method", "route", "code", "ip"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});
/**
 * totalHttpRequestCount -
 * This Counter metric measures total request count made to for a each route
 */
const totalHttpRequestCount = new client.Counter({
  name: "http_total_count",
  help: "total request number",
  labelNames: ["method", "path"],
});
/**
 * totalHttpRequestDuration -
 * This Counter metric measures response time of last request
 */
const totalHttpRequestDuration = new client.Gauge({
  name: "http_total_duration",
  help: "the last duration or response time of last request",
  labelNames: ["method", "path"],
});

// Registers multiple registries on the same endpoint
const mergedRegistries = client.Registry.merge([register, client.register]);

app.use("", (req, res, next) => {
  // Start the timer
  const end = httpRequestDurationMicroseconds.startTimer();

  // Retrieve route from request object
  const route = req.url;
  const ip = req.ip;

  res.on("finish", () => {
    // count number of request
    totalHttpRequestCount.labels(req.method, route).inc();
    // measure duration
    totalHttpRequestDuration.labels(req.method, route).inc(
      new Date().valueOf() -
        // End timer and add labels
        end({ route, code: res.statusCode, method: req.method, ip })
    );
  });

  next();
});

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
 * responds with text information about the proxy server
 */
// @ts-ignore
app.get("/info", (req, res, next) => {
  res.send("This is a proxy service which proxies to Books and Authors APIs.");
});

// @ts-ignore
app.get("/metrics", async (req, res) => {
  // Return all metrics the Prometheus exposition format
  res.setHeader("Content-Type", register.contentType);
  res.end(await mergedRegistries.metrics());
});

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Proxy server is running on http://${HOST}:${PORT}`);
});
