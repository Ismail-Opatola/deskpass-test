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
