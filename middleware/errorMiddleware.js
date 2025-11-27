module.exports = (err, req, res, next) => {
  // If response status code wasn't set, default to 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);

  console.error("Error: ", err.message);

  res.json({
    message: err.message || "Internal Server Error",
    // expose stack only in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
