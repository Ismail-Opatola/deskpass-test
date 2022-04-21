# Node Proxy Server

An HTTP Proxy Server made with the ability to add plugins as middleware.

A proxy is any middleman server that intercepts communication (http request and response) between a client and a server/service usually to hide or isolate both ends of communication from direct interaction. Therefore one end of the communication is anonnymous to the other. Only the proxies knows the identity of both systems.

There are basically two types of web proxy - a foward proxy and a reverse proxy server.

A **forward proxy** handles request and response on-behave of the client (usually a browser). Forward proxies are used to hide a client details such as IP address, geolocation for various reasons such as to bypass web censorship in some countries or blacklisted IPs on a specific website. This example demostrates a forward proxy server.

**Reverse proxies** are any server setup with the intention of hiding the backend services from the client. Reverse proxies could also double as the api-gateway to these backend services. Examples of reverse proxies are **Apache mod_proxy** (can also work as a forward proxy for HTTP), **nginx** (used on hulu.com, spam sites, etc.) **HAProxy, Caddy Webserver** etc.

Using the **Node.js** internal modules, proxies can be created to support both `http` and `https` requests. We'll demostrate:

1. Creating a foward proxy using the `http` module
2. Creating a foward proxy using the `net` module

## Web Proxy Server using node `http` module

### Features

- Intercept and forward http requests
- Request Rate Limiting (cached with Redis database)
- Whilisting IPs - Block unauthorized IP addresses

NOTE: **While this proxy currently support only HTTP requests. This can be extended to handle HTTPs requests.**

### Setup Guide

We'll start by creating a simple `http` server that listen for any request to `http://localhost:8124`.

    const http = require("http");
    const PORT = 8124,
    HOST = "localhost";

    const requestListener = (req, res) => {
      res.writeHead(200);
      res.end("ok");
    };

    const server = http.createServer(requestListener);

    server.listen(PORT, HOST, () => {
      console.log(`Proxy Server is live at http://${HOST}:${PORT}`);
    });

Using node `http` module, we've created a basic http server that listen for any http request sent to port `8124` on our local machine.

**A basic forward proxy**

In order to make the server a proxy, we'll improve the functionality of the `requestListener` from sending a status code and a string-type response body to actualy parsing the incoming client request, and issue a new request to the destination server/website/service with the client request meta data. We'll then listen for any response from the destination server and relay that back to the client.

**First**, we'll need to get the details of the client request which is available to us through the http `request.url` method. The `url` is currently in a string format. It needs to be parsed in order to fragment details of the request. Node provides a `URL` constructor which can be used to convert a url string into object. The `URL` interface represents an object providing static methods used for creating object URLs. It takes two arguements, the request url and optionally the base url of the destination which could be manipulated.

    const requestListener = (req, res) => {
      const reqURL = new URL(req.url, `http://${req.headers.host}/`);
      ...

**Next**, we now have full details of the client request. We can then proceed to the second step of the proxy function which is to send the request to the destination server.

We could send the request without sanitizing or manipulating the client request details, however we may want to control what details are relayed to the destination server. For example - ommit client's IP address, rewrite headers etc.

    const requestListener = (req, res) => {
      ...
      const options = {
        method: req.method,
        headers: req.headers,
        host: reqURL.hostname,
        port: reqURL.port || 80,
        path: reqURL.pathname,
        searchParams: reqURL.searchParams,
      };
      ...

Here we've created an `options` object with only neccessary details the destination server needs to know:

- `method`
- `headers`
- `hostname`
- `port`
- `path`
- `searchParams`

**Next** we'll use the `http` module to issue the request to the destinaton server. Let's create a seperate function that handles this task, we'll name it `proxyRequest`.

Our `proxyRequest` would accept three arguments

- `options` contain the details of the request
- `clientRequest` used to listen for events from the client
- `clientResponse` used to stream incoming response from the external server back to the client.

Since this is also going to be an asynchronous task, we'll make the function asynchronous.

    const proxyRequest = async (options, clientRequest, clientResponse) => {}

Inside the `proxyRequest` we'll construct the server request.

Create a `serverRequest` function that uses the `http` module to initiate the request to the server. The `http` module has a `request` method which when called returns an instance of the http `ClientRequest` object. It accepts two arguments `options` and a `callback` function. On completing our request, the will execute the callback function passing it incoming response object as arguement.

    const proxyRequest = async (options, clientRequest, clientResponse) => {
      const serverRequest = http.request(options, (serverResponse) => {
        // Write Headers to clientResponse

        // Handle error event

        // Forward the data being received from server back to client

        // End the client response when the request from server has completed
      });
    }

When the request callback is executed and passed the server's response, we want to effectively relay the response back to the client. Here, we can also choose to manipulate the response.

In our case, we would **(1)** write back the headers and status code

    ...
    const serverRequest = http.request(options, (serverResponse) => {
      // Write Headers to clientResponse
      clientResponse.writeHead(
        serverResponse.statusCode,
        serverResponse.headers
      );

**(2)** Listen for server error event on response and handle error response.

      ...
      // handle serverRequest error event
      serverRequest.on("error", (error) => {
        errorHandler(error, clientRequest, clientResponse);
      });
      ...

We should also create a resusable error handler to handle error messages for the proxy server.

Open the project root directory in a terminal, create a new folder to group your custom handlers

    $ mkdir lib

Inside of the `lib` folder, create a new file and name it `errorHandler.js`

    $ touch ./lib/errorHandler.js

Inside the `errorHandler.js` file, create a function with 3 parameters - 1st a standard or custom `error` object (contains the `stack`, `status`, `headers`, `message`), 2nd http `request` and 3rd http `response` object. The error handler would perform 3 tasks

- log the error object to the console during development
- (optionally) sends a status code and headers
- format a client response from the error object

      const errorHandler = (error, req, res) => {
        if (process.env.NODE_ENV !== "production") {
          console.error(error);
        }

        if (!res.headersSent) {
          res.writeHead(error?.status || 500, error?.headers || undefined);
        }

        res.end(
          JSON.stringify({
            success: false,
            error: error.message || "Server Error",
            stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
          })
        );
      };

      module.exports = errorHandler;

We can import and use `errorHandler` whenever we need to send the client an error type response.

**(3)** Listen for server response data stream and forward received streams back to the client.

      ...
      // Forward the data being received from server back to client
      serverResponse.on("data", (chunk) => {
        clientResponse.write(chunk);
      });
      ...

**(4)** And then end the connection as soon as the stream is completed

      ...
      // End the client response when the response from server has completed
      serverResponse.on("end", () => {
        clientResponse.end();
      });
    });
    ...

Now that the server request has been constructed, we can listen for data stream from the client, relay them to the server stream and map the end of client request to the server request being made.

      ...
      // Stream data coming from client request to the server request being made
      clientRequest.on("data", (chunk) => {
        serverRequest.write(chunk);
      });

      // Map the end of client request to the server request being made
      clientRequest.on("end", () => {
        serverRequest.end();
      });
    };

This concludes the construction of our `proxyRequest` functionality.

**Now back to our `requestListener` function**, we've parsed and sanitized incoming client request and are ready to pass it onto the `proxyRequest` function responsible for communication with the external server and relaying the server response back to the client. Remember this is an asynchronous operation. We want to exit our `requestListener` context only when `proxyRequest` is done executing or when an error occur within the `requestListener` context. Therefore, we'll make the `requestListener` an asynchronous and wrap its task in a `trycatch` statement.

    ...
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
    ...

Here, if an error occur in any of the process within the `try` block, it immediately exit the process and pass the error details to the `catch` block where we handle the error and end the connection.

#### Extending proxy server features to support plugins

In this example, we'll demostrate using an **\*IP whitelist** and **rate limit** code plugins to improve proxy-server security and performance.

**\*IP whitelist** and **rate limit** plugins are meant to be **middlewares** that intercept incoming request to specific routes and permit/reject client request depending on certain criteria.

Unfortunately, Node `http` has no concept of middleware. We need to either create our own middleware chain or use a framework like `Express`. We'll create ours without any dependency but mimic the `app.use()` middleware handler in `Express`.

**`app.use`** is a way to register middleware or chain of middlewares before executing any end route or intermediary logic depending upon order of middleware registration sequence.

while a **middleware** forms chain of **functions/middleware-functions with 3 parameters req, res and next**. `next` is a callback function which refer to the next middleware-function in chain and in case of last middleware-function of chain next points to first-middleware-function of next registerd middleware-chain.

We'll need a create an `app` object where we would later have methods such as our middleware manager.

    const app = {};

Create middleware stack (usually an array) where all instantiated middlewares would be stored.

    const stack = [];

**Create the middleware stack manager.**

Add a new method to `app` named `use`. All the method does is to update the middleware stack and return `this`. `this` points to the app and returning `this` allow us to have access to the app context even after `app.use` function has been terminated.

    // Create a function that adds a new middleware to the app-level middleware stack
    app.use = function use(middleware) {
      // add middleware
      stack.push(middleware);
      // we'll expose app object as the value of this
      return this;
    };

Currently, all `app.use` does is to update the `stack`, we'll create a function the actually handle calling each middleware in the stack whenever an incoming request.

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
              // reset arg size to 0 -- []
            : slice.call(arguments);

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
            // remove the `this` pointer, make the first args i.e `err` null, add req, res, and next
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

Now the middleware manager is ready to be used. All we have to do is pass `run` to a server instance.

    - const server = http.createServer(requestListener);
    + const server = http.createServer(run);

Now when the a new instance of the server is created, `run` will get executed and call the functions or middleware-functions in our `stack` passing it the 3 arguments req, res and next function.

We can take advantage of this executing order and pass `app.use` the `requestListner` and make sure
its the last process before we actually create the server instance.

    + // Apply request listener
    + app.use(requestListener);

    + // setup http proxy-server
    + const server = http.createServer(run);

##### Create an IP Whitelist Plugin

The effectiveness of IP blocking depends on the filtering policy. If it's an explicit deny, whereby only authorised users [and thus IPs] are added to a whitelist, it can be quite an effective layer of security.

In this scenario, an attacker would need to compromise an allowed host in order to connect to the site.

Also note, Ip whitelisting does not describe a bullet-proof security control. As such, it should be one layer of a greater defence in depth security model.

The implementation simply involves confirming whether or not a request was sent from an authorized IP with `req.ip`. `req.ip` will try to resolve the actual client IP-address.

Its important we provide a list of authorized IPs we'll base the check on.

    $ mkdir plugins
    $ touch ./plugins/ipWhitelist.js

    const errorHandler = require("../lib/errorHandler");

    /**
     * Block unauthorized Ip address
     */
    const ipWhitelist = async (req, res, next) => {
      // Allowed IP addresses
      const WHITELISTED_IPS = ["127.0.0.1"];

      if (process.env.NODE_ENV !== "production") {
        return next();
      }
      // Determines whether WHITELISTED_IPS include the incomming IP address.
      // If true pass-on request to the next middleware or if false return an error response and end request
      if (WHITELISTED_IPS.includes(req.ip)) {
        return next();
      } else {
        return errorHandler(
          { status: 403, message: "UNKOWN/UNAUTHORIZED IP ADDRESS." },
          req,
          res
        );
      }
    };

    module.exports = ipWhitelist;

Before we define our routes, add the ipWhitelist to the middleware stack

    app.use(ipWhitelist);

This will throw an error an block invalid IPs.

##### Create a Rate-Limit Plugin

Rate limiter module helps prevent brute-forcing attacks. It enables specifying how many requests a specific IP address can make during a specified time period.

It is a technique that allows us to handle user requests based on some specified constraint such that:

- There is better flow of data
- There is a reduced risk of attack, i.e., improved security
- The server is never overloaded
- Users can only do as much as is allowed by the developer

A basic quota mechanism limits the number of acceptable requests in a given time window, eg. 10 requests per second.

When quota is exceeded, servers usually do not serve the request replying instead with a 4xx HTTP status code (eg. 429 or 403) or adopt more aggressive policies like dropping connections.

Quotas may be enforced on different basis (eg. per user, per IP, per geolocation) and at different levels. For example, a user may be allowed to issue 100 request per hour.

There are several algorithm use to implement request rate-limit.

For our use-case, We'll implement a sliding window counter. In this technique, the client's requests are grouped by timestamp, and rather than log each request, we keep a counter for each group.

It keeps track of each client's request count while grouping them by fixed time windows(ussually a fraction of the limit's window size). Here's how it works.

When a client's request is received, we check whether the client's record already exists and whether there is already an entry for that timestamp. If both cases are true, we simply increment the counter on the timestamp.

In determining whether the user has exeeded their limit, we retrieve all groups created in the last window, and then sum the counters on them. If the sum equals the limit and the incoming request is dropped. Otherwise, the timestamp is inserted or updated and the request processed.

As an addition, the timestamp groups can be set to expire after the window time is exhausted in order to control the rate at which memory ois consumed.

This approach saves more memory because instead of creating a new entry for every request, we group requests by timestamp and increament the counter.

We'll use this algorithm to kep track of each client's request count per day(24 hours) while grouping them by a fixed one-hour window.

For this implementation, we will be making use of Redis to keep track of each client's request count and timestamp using their IP addresses.

Using the command line we'll install the following packages which allow us to connect to Redis and manipulate time easily within our application. **Also make sure you have redis database installed on your system**.

    $ npm i redis moment --save

Next, create a rateLimiter.js file in our plugins folder

    $ touch ./plugins/rateLimiter.js

Inside the `rateLimiter.js` file, install and import `redis` and `moment.js` from npm, and our custom `errorHandler`.

    const moment = require("moment");
    const redis = require("redis");
    const errorHandler = require("../lib/errorHandler");

We'll use **Redis** as an in-memory storage for keeping track of client activity, while **Moment** helps us accurately parse, validate, manipulate, and display dates and times in javascript.

Next, initialize and connect to `redis` on `127.0.0.1:6379`

    const redisClient = redis.createClient();

    (async () => {
      await redisClient.connect();
    })();

Next, we create a middleware `rateLimiter`, within which we are to implement the rate limiting logic.

    const rateLimiter = async (req, res, next) => {}

Next, initialized all useful constants.

    const rateLimiter = async (req, res, next) => {
      const WINDOW_SIZE_IN_HOURS = 24;
      const MAX_WINDOW_REQUEST_COUNT = 100;
      const WINDOW_LOG_INTERVAL_IN_HOURS = 1;
      ...

Inside the middleware function's create a `trycatch` block. Inside the `try` block, check that the Redis client exists and throw an error if it doesn't.

      ...
      try {
        // check that redis client exists
        if (!redisClient) {
          throw new Error("Redis client does not exist!");
        }
        ...
      }
      catch(error) {
        return errorHandler({ message: `Unable to process request!` }, req, res);
      }

Next, using the client's IP address `req.ip`, we fetch the client's record from Redis.

If `null` is returned, this indicates that no record has been created yet for the client in question. Thus, we create a new record for this client and store it to **Redis** by calling the `set()` method on the Redis client.

        ...
        const fetchCurrentUserRecords = await redisClient.get(req.ip);

        const currentRequestTime = moment();

        //  if no record is found, create a new record for user and store to redis
        if (fetchCurrentUserRecords == null) {
          let newRecord = [];
          let requestLog = {
            requestTimeStamp: currentRequestTime.unix(),
            requestCount: 1,
          };
          newRecord.push(requestLog);
          await redisClient.set(req.ip, JSON.stringify(newRecord));
          return next();
        }
        ...

If a record was found, the value is returned. Thus, we parse that value to JSON and proceed to calculate if the client is eligible to get a response. In order to determine this, we calculate the cumulative sum of requests made by the client in the last window by retrieving all logs with timestamps that are within the last 24hours and sum their corresponding `requestCount`.

        ...
        // if record is found, parse it's value and calculate number of requests users has made within the last window
        let data = JSON.parse(fetchCurrentUserRecords);

        let windowStartTimestamp = moment()
          .subtract(WINDOW_SIZE_IN_HOURS, "hours")
          .unix();

        // where requestTimeStamp is within the last 24hours from now
        let requestsWithinWindow = data.filter((entry) => {
          return entry.requestTimeStamp > windowStartTimestamp;
        });

        if (process.env.NODE_ENV !== "production") {
          console.log("requestsWithinWindow", requestsWithinWindow);
        }

        // Accumulate the amount of request made within the last 24hours time frame
        let totalWindowRequestsCount = requestsWithinWindow.reduce(
          (accumulator, entry) => {
            return accumulator + entry.requestCount;
          },
          0
        );
        ...

If the number of requests in the last window i.e `totalWindowRequestsCount` - is equal to the permitted maximum, we send a response to the client with a constructed **Rate-Limit header and error message** indicating that the user has exceeded their limit.

However, if `totalWindowRequestsCount` is less than the permitted limit, the request is eligible for a response. Thus, we perform some checks to see whether it's been up to one hour since the last log was made. If it has been up to an hour, we create a new log for the current timestamp and store (update) the client's record on Redis.

        ...
        const remainingLimit = MAX_WINDOW_REQUEST_COUNT - totalWindowRequestsCount;

        // if number of requests made is greater than or equal to the desired maximum, return error
        if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
          // Set RateLimit Header Fields
          // https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html
          return errorHandler(
            {
              message: `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_HOURS} hrs limit!`,
              status: 429,
              headers: {
                "X-Rate-Limit-Limit": MAX_WINDOW_REQUEST_COUNT, // the rate limit ceiling for that given endpoint
                "X-Rate-Limit-Remaining": remainingLimit ? remainingLimit : 0, // the number of requests left for the 15 minute window
              },
            },
            req,
            res
          );
        } else {
          // if number of requests made is less than allowed maximum, log new entry
          let lastRequestLog = data[data.length - 1];
          let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
            .subtract(WINDOW_LOG_INTERVAL_IN_HOURS, "hours")
            .unix();

          //  if interval has not passed since last request log, increment counter
          if (
            lastRequestLog.requestTimeStamp >
            potentialCurrentWindowIntervalStartTimeStamp
          ) {
            lastRequestLog.requestCount++; // increase count by 1 ....100th
            data[data.length - 1] = lastRequestLog;
          } else {
            //  if interval has passed, log new entry for current user and timestamp
            data.push({
              requestTimeStamp: currentRequestTime.unix(),
              requestCount: 1,
            });
          }

          await redisClient.set(req.ip, JSON.stringify(data));

          // Set RateLimit Header Fields
          res.setHeader("X-Rate-Limit-Limit", `${MAX_WINDOW_REQUEST_COUNT}`);
          res.setHeader(
            "X-Rate-Limit-Remaining",
            `${remainingLimit ? remainingLimit : 0}`
          );

          return next();
        }
        ...

Remember to export the middleware

    module.exports = rateLimiter;

Back in the `index.js` file, before we define our routes, add the `rateLimiter` to the middleware stack.

    + // Use middleware/plugins at app-level
    + app.use(ipWhitelist);
    + app.use(rateLimiter);

### How to run

- Clone the repository
- Start the proxy by running `cd deskpass-test/proxy-server-demo/proxy-server & npm install & npm start`
- Before testing the proxy, add the HTTP proxy settings to your browser or whole system, i.e. **IP Address: `localhost`** and **Port: `8124`**.
- Try visiting any http site and see for yourself!

## Web Proxy Server using node `net` module

Node `net` module is a low-level approach to building webservers in Node.js. It uses tcp (Transmission Control Protocol), a standard for computer network communication, used in particular for the internet. HTTP is just another protocol that is transferred within the tcp payload and it contains the application data.

### Features

- Intercept and forward both `http` and `https` requests

### Setup Guide

We'll start by creating a simple net server that listens on Port 8124. The server will act as a proxy server for the clients to connect.

    $ touch indexV1.js

    const net = require("net");
    const server = net.createServer();

    server.on("connection", (clientToProxySocket) => {
      console.log('Client Connected To Proxy');
    })

    // handle server error
    server.on("error", (err) => {
      console.log("Internal server error");
      console.log(err);
    });

    server.on("close", () => {
      console.log("Client disconnected");
    });

    server.listen(8124, () => {
      console.log("Server runnig at http://localhost:" + 8124);
    });

When a connection is established, a socket is passed to the callback mentains communication between the client and the server.

**Parsing HTTP/HTTPS**

HTTP and HTTPS are different Protocols so we'll need to handle them separately.

After the connection, we'll only need the first packet data to get the host details. So we use once on the data callback to get the first data and handle error accordingly.

    server.on("connection", (clientToProxySocket) => {
      console.log("Client connected to proxy");

      // We need only the data once, the starting packet
      clientToProxySocket.once("data", (data) => {

        // handle clent to proxy error
        clientToProxySocket.on("error", (err) => {
          console.log(err);
          clientToProxySocket.end(err.message);
        });
      });
    });

We can log the output of data to see the difference for each protocol.

In the case of HTTP, the request `data` contains a `Host` parameter and `port` for HTTP is `80`.

In the case of HTTPS, we can’t read the packet due to the SSL encryption, so it impossible to read host from the packets. But before the actual request, there is a `CONNECT` request which contains the `host` and `port` will be `443`.

Next we need to verify the connection type by checking for the keyword "CONNECT" in the `data`. If true, that means we're recieving an `https` connection else it's an `http` type connection.

      ...
      clientToProxySocket.once("data", (data) => {
        // Verify connection type is HTTP or HTTPS
        let isTLSConnection = data.toString().indexOf("CONNECT") !== -1;
        ...

Next, we'll declare the `serverPort` and `serverAddress` depending on the connection type.

        ...
        // Set default Port
        let serverPort = 80;
        let serverAddress;

        if (isTLSConnection) {
          // if connection is HTTPS change port to 443 and parse the host address from CONNECT
          serverPort = 443;
          serverAddress = data
            .toString()
            .split("CONNECT ")[1]
            .split(" ")[0]
            .split(":")[0];
        } else {
          // if connection is HTTP, parse HOST address
          serverAddress = data.toString().split("Host: ")[1].split("\r\n")[0];
        }
        ...

With the `serverPort` and `serverAddress` been identified, we're ready to relay the client request to the destination server. To connect to an external server, we'll use `net.createConnection()`. It takes two parameters, an option object containing the host and port to connect and the second is the connected callback.

        ...
        // Create a connection from proxy to destination server
        let proxyToServerSocket = net.createConnection(
          {
            host: serverAddress,
            port: serverPort,
          },
          () => {}
        );
        ...

Inside the `callback`, in the case of `https` we'll send back a `200` status code to the client, while for `http` we'll send off the request to the destination server.

        ...
        // Create a connection from proxy to destination server
        let proxyToServerSocket = net.createConnection(
          {
            host: serverAddress,
            port: serverPort,
          },
          () => {
            if (isTLSConnection) {
              // Send Back OK to HTTPS CONNECT Request
              clientToProxySocket.write("HTTP/1.1 200 OK\r\n\n");
            } else {
              proxyToServerSocket.write(data);
            }
          }
        );
        ...

Lastly, we'll we simply pipe the `clientToProxySocket` to `proxyToServerSocket` and handle error

        ...

        // Create a connection from proxy to destination server
        let proxyToServerSocket = net.createConnection(
          {
            host: serverAddress,
            port: serverPort,
          },
          () => {
            if (isTLSConnection) {
              // Send Back OK to HTTPS CONNECT Request
              clientToProxySocket.write("HTTP/1.1 200 OK\r\n\n");
            } else {
              proxyToServerSocket.write(data);
            }

            // Piping the sockets
            clientToProxySocket.pipe(proxyToServerSocket);
            proxyToServerSocket.pipe(clientToProxySocket);

            // handle proxy server error
            proxyToServerSocket.on("error", (err) => {
              console.log(err);
            });
          }
        );
        ...

### How to run

- Clone the repository
- Start the proxy by running `cd deskpass-test/proxy-server-demo/proxy-server & node indexV1.js`
- Before testing the proxy, add the HTTP proxy settings to your browser or whole system, i.e. **IP Address: `localhost`** and **Port: `8124`**.
- Try visiting any http or https site and see for yourself!
