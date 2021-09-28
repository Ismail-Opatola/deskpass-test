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

## Monitoring
