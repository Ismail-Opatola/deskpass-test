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
