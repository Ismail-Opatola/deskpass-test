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
