// Helper script to create a properly formatted data URI from a private key
var fs = require('fs');
var path = require('path');

// Read the private key
var keyId = 'an-issuer/public.pem';
var privateKeyPath = path.join('test/integration/key-server/an-issuer/private.pem');
var privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Format for data URI: data:application/x-pem-file;kid=<keyId>,<base64-encoded-key>
// First, base64 encode the private key
var base64Key = Buffer.from(privateKey).toString('base64');

// Create the data URI
var dataUri = 'data:application/x-pem-file;kid=' + keyId + ',' + base64Key;

// Write to file
fs.writeFileSync(
    path.join('test/integration/key-server/an-issuer/private-datauri'), 
    dataUri,
    'utf8'
);

console.log('Created data URI and saved to private-datauri');
