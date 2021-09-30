# Node Proxy server

## Requirements

- Node.js version 8 or higher - Javascript runtime environment
- NPM OR Yarn - Package management tool

## Summary

This Node Proxy is an intermediary application.

### Features

- It sits between the client and two backend services; books and authors.
- It processes/modifies the requests and responses in both directions.
- The Application is capable of monitoring http request and response.

### Currently captured metrics

- Duration of HTTP requests in microseconds
- Total request number
- Response time of last request

  Captured metrics are exposed at `localhost://8000/metrics` endpoint.
  This allows the use of Prometheus and Grafana service to store and visualize metrics.

### Proxy use-case

- **Authorization** - Forward only authorized requests to access a service.
- **Logging** - Log every requests going to a Back End API service.

## The Project Developement

---

**Initialize project**:

    mkdir proxy-server
    cd proxy-server
    npm init -y

This will generate a `package.json` file which will contain a basic project configuration.

**Install dependencies**:

We need a few packages to make our proxy server:

- _express_: Minimalist web framework
- _http-proxy-middleware_: Simple proxy framework
- (optional) _morgan_ - HTTP request logger middleware

Install these packeges by running:

    npm install express http-proxy-middleware morgan

### Create a proxy

Open the _index.js_ file and add the necessary imports:

    const express = require('express');
    const morgan = require("morgan");
    const { createProxyMiddleware } = require('http-proxy-middleware');

#### Create basic express server

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

#### Implement proxy

`Http-proxy-middleware` has an api which can be used to intercept request/response to our server called `createProxyMiddleware`. The middleware is responsible for proxying incoming request, with the behavior/lifecycle defined by us.

For this example, our proxy-server will handle connection between the client and two backend services; **books** and **authors**.

Using the `createProxyMiddleware`, we want to proxy all requests starting with `/books`, `/authors` to the **books-server** and **authors-server** respectively.

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

We've added proxy endpoints and redefined each path to the root of each server.

**For example**:

When a request is made to the proxy-server to get authors data, `localhost://8000/authors/100`.

`/authors` will be replaced with `/` and forward to the authors endpoint, such that `localhost://8000/authors/100` becomes `<author-service-endpoint>/100`

Start the configured server

    app.listen(PORT, HOST, () => {
      console.log(`Proxy server is running on http://${HOST}:${PORT}`);
    });

### Create a minimal Authors and Books service

#### Authors service

Create a new directory

    cd ../
    mdir authors-server
    cd authors-server

Create `index.js` file and add code

    const http = require("http");

    const HOST = "localhost";
    const PORT = 8002;

    const authors = JSON.stringify([
      {
        name: "Irving Wallace",
        countryOfBirth: "United States",
        yearOfBirth: 1916,
      },
      {
        name: "Chimamanda Ngozi Adichie",
        countryOfBirth: "Nigeria",
        yearOfBirth: 1977,
      },
    ]);

    /**
     * Request Handler
     * @param {object} req
     * @param {object} res
     *
     * handle an incoming HTTP request and return an HTTP response
     */
    const requestListener = function (req, res) {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/") {
        res.writeHead(200);
        res.end(authors);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Resource not found" }));
      }
    };

    const server = http.createServer(requestListener);

    server.listen(PORT, HOST, () => {
      console.log(`Authors Server is running on http://${HOST}:${PORT}`);
    });

Run the authors server

    node .\authors server\index.js

#### Books service

Create a new directory

    cd ../
    mdir books-server
    cd books-server

Create `index.js` file and add code

    const http = require("http");

    const HOST = "localhost";
    const PORT = 8001;

    const books = JSON.stringify([
      { title: "The Seven Minutes", author: "Irving Wallace", year: 1969 },
      {
        title: "Half of a Yellow Sun",
        author: "Chimamanda Ngozi Adichie",
        year: 2006,
      },
    ]);

    /**
     * Request Handler
     * @param {object} req
     * @param {object} res
     *
     * handle an incoming HTTP request and return an HTTP response
     */
    const requestListener = function (req, res) {
      if (req.url === "/") {
        res.writeHead(200);
        res.end(books);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Resource not found" }));
      }
    };

    const server = http.createServer(requestListener);

    server.listen(PORT, HOST, () => {
      console.log(`Books Server is running on http://${HOST}:${PORT}`);
    });

Run the books server

    node .\books-server\index.js

### Test the proxy server

Start the proxy server

    node.\proxy-server\index.js

Ensure both both services are live and test request

    curl localhost:8000/books

Output:

    Forbidden

This is because the authorization middleware implemented requires that every request contains an authorization header.

    ...
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
    ...

You can add [custom header to your request from the browser](https://infoheap.com/chrome-add-custom-http-request-headers/) or use `curl`

    curl -H "Authorization: ismail" localhost:8000/books

You should get a `200` status response with books data in JSON format.

### (Optional) Test unsupported HTTP methods denial

    curl -X POST -H "Authorization: ismail" --data '{name: "Stephen King",countryOfBirth: "United States",yearOfBirth: 1947,}' http://localhost:8000/authors

Output:

    Bad request

## Setup Application Monitoring with Prom-client, Prommetheus and Grafana

**Prom-client** is a Prometheus client library for Node.js, used to collect application metrics. It provides the building blocks to export metrics to Prometheus via the pull and push methods and supports all Prometheus metric types such as histogram, summaries, gauges and counters.

Install prom-client

    cd proxy-server/
    npm install prom-client

### Expose and customize server metrics

open prom-client/index.js and import prom-client

    ...
    const client = require("prom-client");

Creates a Registry which registers the metrics we intend to collect

    const register = new client.Registry();

Adds a default label which is added to all metrics. This is a unique identifier-prefix added to the label.

    register.setDefaultLabels({
      app: "node-proxy-server",
    });

(optional) Enable the collection of default metrics

    client.collectDefaultMetrics({ register });

#### Setup custom metrics

We will measure 3 things

- HTTP request duration per microseconds.
- Total HTTP request count.
- Total HTTP request duration.

The metrics captured depends on what is critical to the business/application model.

    ...
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

#### Expose server metrics

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

### View application metrics

Start the proxy server

    node .\index.js

To test the app monitoring, open your browser and make multiple requests to `localhost://8000/authors`, `localhost://8000/books`. Alternatively, use `curl`.

    curl -H "Authorization: ismail" localhost:8000/books

Navigate to `localhost://8000/metrics` to view captured metrics.

    curl -H "Authorization: ismail" localhost://8000/metrics

Captured metrics are exposed at `localhost://8000/metrics` endpoint. This allows the use of Prometheus and Grafana service to store and visualize metrics.
