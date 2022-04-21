const http = require("http");
const errorHandler = require("./lib/errorHandler");
const rateLimiter = require("./plugins/rateLimiter");
const ipWhitelist = require("./plugins/ipWhitelist");

const PORT = 8124,
  HOST = "localhost";

// Create a app object
let app = {},
  // create middleware stack
  stack = [];

app.foo = 99;

// Create a function that adds a new middleware to the app-level middleware stack
app.use = function use(middleware) {
  // add middleware
  stack.push(middleware);
  // we'll expose app object as the value of this
  return this;
};

// factory function returns a function that execute middlewares and handles error
let run = (function factory() {
  let slice = Array.prototype.slice;

  // internal error handler
  function fail(err) {
    throw err;
  }

  return function run() {
    let self = this;
    let i = 0;

    // grab the last argument (req, res, *next*)
    let last = arguments[arguments.length - 1];

    // if last argument is a function (next/callback)
    // note - req and res are objects
    let done = "function" == typeof last && last;

    // array of any size
    let args =
      // if current middleware has (next/callback) as arg -- [err, req, res, **next**]
      done
        ? // remove the last argument (i.e next/callback) and return `req` and `res` -- [req, res]
          slice.call(arguments, 0, arguments.length - 1)
        : // reset arg size to 0 -- []
          slice.call(arguments);

    // next step
    function next(err) {
      // if the next is called with an error
      // do
      // if (next/callback), call the (next/callback) and pass it the error
      // else if (next/callback) wasn't provided, call internal error handler and pass it the error
      // fail will throw an error
      if (err) return (done || fail)(err);

      // if no error

      // get the next middleware
      let fn = stack[i++];
      // get all arguments [err,req,res,next]
      let arr = slice.call(args);

      // if no more middleware
      if (!fn) {
        // if (next/callback)
        // remove the `this` pointer, make the first args i.e `err` null, add req, res, and next args
        return done && done.apply(null, [null].concat(args));
      }

      // update arg, pass next to arr
      arr.push(next);
      // call the next middleware with updated arguments
      fn.apply(self, arr);
    }

    // call the next function
    next();

    // return this context
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

    await proxyRequest(options, req, res);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

const proxyRequest = async (options, clientRequest, clientResponse) => {
  const serverRequest = http.request(options, (serverResponse) => {
    // Write Headers to clientResponse
    clientResponse.writeHead(serverResponse.statusCode, serverResponse.headers);

    // handle serverRequest error event
    serverRequest.on("error", (error) => {
      errorHandler(error, clientRequest, clientResponse);
    });

    // Forward the data being received from server back to client
    serverResponse.on("data", (chunk) => {
      clientResponse.write(chunk);
    });

    // End the client response when the response from server has completed
    serverResponse.on("end", () => {
      clientResponse.end();
    });
  });

  // Stream data coming from client request to the server request being made
  clientRequest.on("data", (chunk) => {
    serverRequest.write(chunk);
  });

  // Map the end of client request to the server request being made
  clientRequest.on("end", () => {
    serverRequest.end();
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
