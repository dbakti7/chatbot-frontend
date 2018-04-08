function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

// -------------------- CONFIG --------------------

// set to true to deploy with HTTPS, set to false for local deployment (http)
define("IS_PRODUCTION", false);

// set to true to query Dialogflow agent directly
// set to false to redirect query to server
define("DIRECT_QUERY", true);

// used when DIRECT_QUERY = true
define("DIALOGFLOW_TOKEN", "58be6f8f4fb9447693edd36fb975bece"); 

// set to true to enable client-side spellchecking, false otherwise
define("USE_SPELLCHECKING", true);

// SSL certs location, only used when IS_PRODUCTION = true
define("CERT_FILE", "/etc/letsencrypt/live/www.pieceofcode.org/fullchain.pem");
define("KEY_FILE", "/etc/letsencrypt/live/www.pieceofcode.org/privkey.pem");

// put client deployment url here, only used when IS_PRODUCTION = true
// therefore, must start with 'https://'
define("DEPLOYMENT_URL", "https://www.pieceofcode.org");

// set port number, only used when IS_PRODUCTION = false
define("LOCALHOST_PORT", "3000");

// golang server url, only used when DIRECT_QUERY = false
define("SERVER_URL", "https://www.pieceofcode.org:8080"); // when IS_PRODUCTION = true
define("SERVER_URL_LOCAL", "http://localhost:8080"); // when IS_PRODUCTION = false


// -------------------- STATIC --------------------
// this section is mostly static, there is no need to change them for most of the time

define("SERVER_ENDPOINT", "/internal-query"); // endpoint used when DIRECT_QUERY = false
define("DIALOGFLOW_QUERY_ENDPOINT", "/df-query"); // endpoint used when DIRECT_QUERY = true
define("PREPROCESS_ENDPOINT", "/preprocess"); // client-side spellchecking endpoint

define("LOCALHOST", "http://localhost");