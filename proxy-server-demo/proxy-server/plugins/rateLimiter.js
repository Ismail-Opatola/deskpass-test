// @ts-nocheck

/**
 *  Rate limiter module helps prevent brute-forcing attacks. It enables specifying how many requests a specific IP address can make during a specified time period
 *
 * It is a technique that allows us to handle user requests based on some specified constraint such that:
 *
 * There is better flow of data
 * There is a reduced risk of attack, i.e., improved security
 * The server is never overloaded
 * Users can only do as much as is allowed by the developer
 */

const moment = require("moment");
const redis = require("redis");
const errorHandler = require("../lib/errorHandler");

const redisClient = redis.createClient();
const WINDOW_SIZE_IN_HOURS = 24;
const MAX_WINDOW_REQUEST_COUNT = 100;
const WINDOW_LOG_INTERVAL_IN_HOURS = 1;

(async () => {
  await redisClient.connect();
})();

/**
 * Limit an IP's allowed max request to `100` within `24hour` window.
 * Uses `redis` to cache request count by IP. 
 * Sets `X-Rate-Limit-Limit` and `X-Rate-Limit-Remaining` headers on every request.
 */
const rateLimiter = async (req, res, next) => {
  try {
    // check that redis client exists
    if (!redisClient) {
      throw new Error("Redis client does not exist!");
      process.exit(1);
    }

    // check that ip address exists
    // @IMPORTANT - If running in development mode i.e localhost, IP would be undefined. Comment out the code-block to disable check.
    // if (!Boolean(req.ip)) {
    //   return errorHandler({ message: `No IP Address!`, status: 403 }, req, res);
    // }

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
  } catch (error) {
    return errorHandler({ message: `Unable to process request!` }, req, res);
  }
};

module.exports = rateLimiter;
