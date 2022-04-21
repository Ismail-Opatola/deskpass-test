const net = require("net");
const server = net.createServer();

server.on("connection", (clientToProxySocket) => {
  console.log("Client connected to proxy");

  // We need only the data once, the starting packet
  clientToProxySocket.once("data", (data) => {
    // Verify connection type is HTTP or HTTPS
    let isTLSConnection = data.toString().indexOf("CONNECT") !== -1;

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

    // handle clent to proxy error
    clientToProxySocket.on("error", (err) => {
      console.log(err);
      clientToProxySocket.end(err.message);
    });
  });
});

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
