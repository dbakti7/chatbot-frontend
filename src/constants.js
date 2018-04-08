function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

// set to true to deploy with HTTPS
define("IS_PRODUCTION", false);

// SSL Certs locations, only used when IS_PRODUCTION is true
define("CERT_FILE", "/etc/letsencrypt/live/www.pieceofcode.org/fullchain.pem");
define("KEY_FILE", "/etc/letsencrypt/live/www.pieceofcode.org/privkey.pem");

define("LOCALHOST", "http://localhost");
define("LOCALHOST_PORT", "3000"); // only used when IS_PRODUCTION is false

// set to true to enable client-side spellchecking, false otherwise
define("USE_SPELLCHECKING", true);

// client-side spellchecking endpoint
define("PREPROCESS_ENDPOINT", "/preprocess");

// server url and end-point as proxy to Dialogflow
define("SERVER_URL", "https://www.pieceofcode.org:8080");
define("SERVER_URL_LOCAL", "http://localhost:8080");
define("SERVER_ENDPOINT", "/internal-query");