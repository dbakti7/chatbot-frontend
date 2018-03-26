function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("IS_PRODUCTION", false);
define("SERVER_URL", "https://www.pieceofcode.org:8080/internal-query")
define("PREPROCESS_URL", "https://www.pieceofcode.org/preprocess")