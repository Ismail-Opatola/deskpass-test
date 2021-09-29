# Node Proxy server

## What is a Proxy

Proxy is an intermediary application. It sits between two (or more) services, processes or modifies the requests and responses in both directions.

## Use cases

- **Authorization** - Forward only authorized requests to access a service.
- **Load balancing** - Distribute inbound requests traffic equally among instances.
- **Logging** - Log every requests going to a Back End API service.

**Initialize the project** -

    npm init -y

This will generate a package.json file which will contain a basic project configuration.

**Install dependencies:**
We need a few packages to make the proxy work:

- _express_: Minimalist web framework
- _http-proxy-middleware_: Simple proxy framework
- (optional) _morgan_ - HTTP request logger middleware

which we can install by running:

    npm install express http-proxy-middleware morgan

### Create a proxy

Open the _index.js_ file and add the necessary imports:

    const express = require('express');
    const morgan = require("morgan");
    const { createProxyMiddleware } = require('http-proxy-middleware');

Create basic express server

    // Create Express Server
    const app = express();

    // Configuration
    const PORT = 3000;
    const HOST = "localhost";
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
     * Info GET endpoint
     * ---
     * @returns text response information about the proxy server
     */
    app.get("/info", (req, res, next) => {
      res.send("This is a proxy service which proxies to Books and Authors APIs.");
    });

Add proxy endpoints with redefined path to "/" each server root. We want to proxy all requests starting with "/books", "/authors" to the books-server and authors-server respectively. Ensure both servers are live.

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

start the configured server

    app.listen(PORT, HOST, () => {
      console.log(`Proxy server is running on http://${HOST}:${PORT}`);
    });

Test the proxy server

    curl localhost:8000/books

Output:

    Forbidden

The Authorization middleware implemented requires that every request contains an Authorization Header

Add custom header to your request from the browser

    <https://infoheap.com/chrome-add-custom-http-request-headers/>

Alternatively, use curl

    curl -H "Authorization: ismail" localhost:8000/books

Test unsupported methods denial

    curl -X POST -H "Authorization: ismail" --data '{name: "Stephen King",countryOfBirth: "United States",yearOfBirth: 1947,}' http://localhost:8000/authors

Output:

    Bad request

## Setup Application Monitoring with Prom-client, Prommetheus and Grafana

Install Node.js Prometheus client and collect default metrics

    npm install prom-client

### Expose and customize server metrics

Import dependency

    ...
    const client = require("prom-client");


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

Expose server metrics

    /**
     * Metrics - GET endpoint
     * ---
     * Get all registerd metrics.
     * (Optional) This API can be consumed and visualized by connecting
     * Prometheus and Grafana service.
     */
    app.get("/metrics", async (req, res) => {
      // Return all metrics the Prometheus exposition format
      res.setHeader("Content-Type", register.contentType);
      res.end(await mergedRegistries.metrics());
    });

Test run proxy server

    node .\index.js
