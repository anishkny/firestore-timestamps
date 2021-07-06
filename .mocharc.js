const TIMEOUT = process.env.MOCHA_TIMEOUT
  ? Number(process.env.MOCHA_TIMEOUT)
  : 30_000;

module.exports = {
  timeout: TIMEOUT,
};
