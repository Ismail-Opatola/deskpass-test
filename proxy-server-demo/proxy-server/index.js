const http = require("http");
const errorHandler = require("./lib/errorHandler");
const rateLimiter = require("./plugins/rateLimiter");
const ipWhitelist = require("./plugins/ipWhitelist")

const PORT = 8124,
  HOST = "localhost";

// Create a app-level middleware stack
let app = {},
  middlewares = [];

// Create a function that adds a new middleware to the app-level middleware stack
app.use = function use(fn) {
  middlewares.push(fn);
  return this;
};

// factory function returns a function that execute middlewares and handles error
let run = (function factory() {
  let slice = Array.prototype.slice;

  function fail(err) {
    throw err;
  }

  return function run() {
    let self = this;
    let i = 0;
    let last = arguments[arguments.length - 1];
    let done = "function" == typeof last && last;
    let args = done
      ? slice.call(arguments, 0, arguments.length - 1)
      : slice.call(arguments);

    // next step
    function next(err) {
      if (err) return (done || fail)(err);
      let fn = middlewares[i++];
      let arr = slice.call(args);

      if (!fn) {
        return done && done.apply(null, [null].concat(args));
      }

      arr.push(next);
      fn.apply(self, arr);
    }

    next();

    return this;
  };
})();

// create an app-level request listener
const requestListener = async (req, res) => {
  try {
    const reqURL = new URL(req.url, `http://${req.headers.host}/`);

    const options = {
      method: req.method,
      headers: req.headers,
      host: reqURL.hostname,
      port: reqURL.port || 80,
      path: reqURL.pathname,
      searchParams: reqURL.searchParams,
    };

    await executeRequest(options, req, res);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

const executeRequest = async (options, clientRequest, clientResponse) => {
  const externalRequest = http.request(options, (externalResponse) => {
    // Write Headers to clientResponse
    clientResponse.writeHead(
      externalResponse.statusCode,
      externalResponse.headers
    );

    externalResponse.on("end", () => {
      clientResponse.end();
    });

    // Forward the data being received from external source back to client
    externalResponse.on("data", (chunk) => {
      clientResponse.write(chunk);
    });

    // End the client response when the request from external source has completed
    externalResponse.on("end", () => {
      clientResponse.end();
    });
  });

  // handle externalRequest error event
  externalRequest.on("error", (error) => {
    errorHandler(error, clientRequest, clientResponse);
  });

  // Map data coming from client request to the external request being made
  clientRequest.on("data", (chunk) => {
    externalRequest.write(chunk);
  });

  // Map the end of client request to the external request being made
  clientRequest.on("end", () => {
    externalRequest.end();
  });
};

// Use middleware/plugins at app-level
app.use(ipWhitelist);
app.use(rateLimiter);

// Apply request listener
app.use(requestListener);

// setup http proxy-server
const server = http.createServer(run);

server.listen(PORT, HOST, () => {
  console.log(`Proxy Server is live at http://${HOST}:${PORT}`);
});
