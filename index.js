var client = require('./lib/client/jwt-generator');
var server = require('./lib/server/validator/jwt-validator');
module.exports = {
    client: client,
    server: server
};