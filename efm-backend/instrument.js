// instrument.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://fac78913bbdf06b96c05d1c3e11dcc50@o4511517333389312.ingest.de.sentry.io/4511517349052496",
  // 1.0 captures 100% of performance transactions during community launch. 
  // You can tune this down to 0.1 later to conserve free-tier limits.
  tracesSampleRate: 1.0, 
});