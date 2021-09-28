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
