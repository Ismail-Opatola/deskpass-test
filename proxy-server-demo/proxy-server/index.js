/**
 * Summary
 * ----
 * This Proxy is an intermediary application.
 *
 * Features:
 * + It sits between the client and two backend services; books and authors.
 * + It processes/modifies the requests and responses in both directions.
 * + The Application is capable of monitoring http request and response.
 *
 * Currently captured metrics:
 * + Duration of HTTP requests in microseconds
 * + Total request number
 * + Response time of last request
 *
 * Captured metrics are exposed at `localhost://8000/metrics` endpoint.
 * This allows the use of Prometheus and Grafana service to store and visualize metrics.
 *
 * Proxy use-case:
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
 * Logs the incoming requests during developement.
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
 * HTTP Method Ristriction
 * ---
 * Allow only supported methods
 */
app.use("", (req, res, next) => {
  if (SUPPORTED_HTTP_METHODS.includes(req.method)) {
    next();
  } else {
    res.sendStatus(405);
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
 * httpRequestDurationMicroseconds
 * ---
 * This histogram metric measures request duration under 10 seconds
 */
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in microseconds",
  labelNames: ["method", "route", "code", "ip"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

/**
 * totalHttpRequestCount
 * ---
 * This Counter metric measures total request count made to a each route
 */
const totalHttpRequestCount = new client.Counter({
  name: "http_total_count",
  help: "total request number",
  labelNames: ["method", "path"],
});

/**
 * totalHttpRequestDuration
 * ---
 * This Counter metric measures response time of last request
 */
const totalHttpRequestDuration = new client.Gauge({
  name: "http_total_duration",
  help: "the last duration or response time of last request",
  labelNames: ["method", "path"],
});

/**
 * Registers multiple registries on the same endpoint
 * i.e [totalHttpRequestDuration,
 * totalHttpRequestCount,
 * httpRequestDurationMicroseconds]
 */
const mergedRegistries = client.Registry.merge([register, client.register]);

/**
 * Custom Middelware
 * ---
 * Captures httpRequestDurationMicroseconds
 * Captures totalHttpRequestCount
 * Captures totalHttpRequestDuration
 */
app.use("", (req, res, next) => {
  // Start the timer
  const end = httpRequestDurationMicroseconds.startTimer();

  // Retrieve route from request object
  const route = req.url;
  const ip = req.ip;

  // listen for finished response event and execute callback
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
 * Proxy Middleware - Books service
 * ---
 * + Proxy all requests starting with "/books" to the books-server.
 * + Define a pathRewrite so that /books is re-written as "/"
 * when forwarded to the books API.
 *
 * Requirement: Ensure the books-server is live.
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
 * Proxy Middleware - Authors service
 * ---
 * + Proxy all requests starting with "/authors" to the authors-server.
 * + Define a pathRewrite so that /authors is re-written as "/"
 * when forwarded to the authors API
 *
 * Requirement: Ensure the authors-server is live.
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
 * Info - GET endpoint
 * ---
 * responds with text information about the proxy server
 */
app.get(["/", "/info"], (req, res, next) => {
  res.setHeader("Content-Type", "text/html");
  res.send(
    `<p>This is a proxy service which proxies to Books and Authors APIs.</p> 
    <p><b>API Details:</b></p>
    <table>
      <thead>
        <th>No.</th>
        <th>Title</th>
        <th>Method</th>
        <th>Endpoint</th>
      </thead>
      <tbody>
      <tr>
        <td>1.</td>
        <td>Authors</td>
        <td>GET</td>
        <td><a href="/authors">localhost://8000/authors</a></td>
      </tr>
      <tr>
        <td>2.</td>
        <td>Books</td>
        <td>GET</td>
        <td><a href="/books">localhost://8000/books</a></td>
      </tr>
      <tr>
        <td>3.</td>
        <td>Metrics</td>
        <td>GET</td>
        <td><a href="/metrics">localhost://8000/metrics</a></td>
      </tr>
      <tr>
        <td>4.</td>
        <td>Info</td>
        <td>GET</td>
        <td><a href="/info">localhost://8000/info</a></td>
      </tr>
      </tbody>
    </table>`
  );
});

/**
 * Metrics - GET endpoint
 * ---
 * Get all registerd metrics.
 * This API can be consumed by Prometheus.
 */
app.get("/metrics", async (req, res) => {
  // Return all metrics the Prometheus exposition format
  res.setHeader("Content-Type", register.contentType);
  res.end(await mergedRegistries.metrics());
});

// Start the Proxy Server
app.listen(PORT, HOST, () => {
  console.log(`Proxy server is running on http://${HOST}:${PORT}`);
});
