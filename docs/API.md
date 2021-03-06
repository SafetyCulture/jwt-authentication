#Index

**Modules**

* [client/jwt-generator](#module_client/jwt-generator)
  * [client/jwt-generator.create()](#module_client/jwt-generator.create)
* [server/http/jwt-auth-middleware](#module_server/http/jwt-auth-middleware)
  * [server/http/jwt-auth-middleware.create(jwtValidator, authorizedSubjects, [logger])](#module_server/http/jwt-auth-middleware.create)
* [server/validator/jwt-validator](#module_server/validator/jwt-validator)
  * [server/validator/jwt-validator.create(config)](#module_server/validator/jwt-validator.create)

**Classes**

* [class: Generator](#Generator)
  * [generator.generateToken(claims, options, callback)](#Generator#generateToken)
  * [generator.generateAuthorizationHeader(claims, options, callback)](#Generator#generateAuthorizationHeader)
* [class: Validator](#Validator)
  * [validator.validate(jwtToken, authorizedSubjects, callback)](#Validator#validate)

**Functions**

* [getKey(keyId)](#getKey)
* [getKey(keyId)](#getKey)

**Members**

* [TIME_CLAIM_LEEWAY](#TIME_CLAIM_LEEWAY)

**Typedefs**

* [callback: GenerateTokenCallback](#GenerateTokenCallback)
* [callback: GenerateAuthorizationHeaderCallback](#GenerateAuthorizationHeaderCallback)
* [callback: next](#next)
* [callback: JWTAuthMiddlewareCallback](#JWTAuthMiddlewareCallback)
* [callback: ValidateCallback](#ValidateCallback)
 
<a name="module_client/jwt-generator"></a>
#client/jwt-generator
<a name="module_client/jwt-generator.create"></a>
##client/jwt-generator.create()
Constructor of `Generator` objects.

**Returns**: [Generator](#Generator)  
**Example**  
```js
var client = require('jwt-authentication').client;
var generator = generator.create();
```
A base url for the server containing the public keys of the issuers of the tokens.

<a name="module_server/http/jwt-auth-middleware"></a>
#server/http/jwt-auth-middleware
<a name="module_server/http/jwt-auth-middleware.create"></a>
##server/http/jwt-auth-middleware.create(jwtValidator, authorizedSubjects, [logger])
Constructor of http middleware function for jwt authentication.

**Params**

- jwtValidator <code>[Validator](#Validator)</code> - `Validator` object  
- authorizedSubjects `Array.<String>` - array of authorized subject  
- \[logger\] `Object` - optional logger object to log 401 errors  

**Returns**: [JWTAuthMiddlewareCallback](#JWTAuthMiddlewareCallback) - - middleware function to authenticate requests  
**Example**  
```js
var server = require('jwt-authentication').server;
var validator = server.create({
                                publicKeyBaseUrl: 'https://public-key-server.com/',
                                resourceServerAudience: 'my-service'
                              });
var authMiddleware = require('jwt-authentication').httpAuthMiddleware;
var validator = server.create(validator);
```

<a name="module_server/validator/jwt-validator"></a>
#server/validator/jwt-validator
<a name="module_server/validator/jwt-validator.create"></a>
##server/validator/jwt-validator.create(config)
Constructor of `Validator` objects.

**Params**

- config `Object`  
  - publicKeyBaseUrl `String` - A base url for the server containing the public keys of the issuers of the tokens. Must end with a slash  
  - resourceServerAudience `String` - all JWT messages will need to have this audience to be valid  
  - ignoreMaxLifeTime `boolean` - Setting this property will skip the 1 hour max lifetime checks 
and make your server less secure. Do not include this if you are not sure what you are doing.  

**Returns**: [Validator](#Validator)  
**Example**  
```js
var server = require('jwt-authentication').server;
var validator = server.create({
                                publicKeyBaseUrl: 'https://public-key-server.com/',
                                resourceServerAudience: 'my-service'
                              });
```

<a name="Generator"></a>
#class: Generator
**Members**

* [class: Generator](#Generator)
  * [generator.generateToken(claims, options, callback)](#Generator#generateToken)
  * [generator.generateAuthorizationHeader(claims, options, callback)](#Generator#generateAuthorizationHeader)

<a name="Generator#generateToken"></a>
##generator.generateToken(claims, options, callback)
Generates a jwt token.

**Params**

- claims `Object` - The claims to be included in the token. Custom claims are permitted.  
  - iss `String` - Issuer. The name of the system issuing the token.
This name should match the name of a key in the `publicKeyServer`.  
  - sub `String` - Subject. The name of the system the token is for.
If the subject is generating tokens for itself the `sub` and `iss` should be the same.  
  - aud `String` - Audience. The value that identifies the resource server. This can
also be an array of strings when the token is intended for multiple resource servers.  
- options `Object`  
  - privateKey `String` - The private key to use when generating the token.  
  - kid `String` - Key ID. The identifier of the key used to sign the token in the format
'issuer/key-id' where issuer matches claims.iss.  
  - \[expiresInSeconds=30\] `Number` - The number of seconds until the token expires.  
  - \[notBefore=Date\] `Number` - date not before the token is valid (in seconds Math.floor(date / 1000).  
- callback <code>[GenerateTokenCallback](#GenerateTokenCallback)</code> - The callback that is called when the token has been generated.  

**Example**  
```js
var claims = {iss: 'name-of-client', sub: 'name-of-client', aud: 'name-of-server'};
var options = {privateKey: 'a-private-key', kid: 'name-of-client/key-id.pem'};
generator.generateToken(claims, options, function (error, token) {
    if (error) {
        console.log('Generating token failed.', error);
    } else {
        console.log(token); // -> "[token]"
    }
});
```

<a name="Generator#generateAuthorizationHeader"></a>
##generator.generateAuthorizationHeader(claims, options, callback)
Generates an authorization header value containing a jwt token.
The format of the value is `Bearer [token]`.

**Params**

- claims `Object` - The claims to be included in the token. Custom claims are permitted.  
  - iss `String` - Issuer. The name of the system issuing the token.
This name should match the name of a key in the `publicKeyServer`.  
  - sub `String` - Subject. The name of the system the token is for.
If the subject is generating tokens for itself the `sub` and `iss` should be the same.  
  - aud `String` - Audience. The value that identifies the resource server. This can also
be an array of strings when the token is intended for multiple resource servers.  
- options `Object`  
  - privateKey `String` - The private key to use when generating the token.  
  - kid `String` - Key ID. The identifier of the key used to sign the token in the format
'issuer/key-id' where issuer matches claims.iss.  
  - \[expiresInSeconds=30\] `Number` - The number of seconds until the token expires.  
  - \[notBefore=Date\] `Number` - date not before the token is valid (in seconds Math.floor(date / 1000).  
- callback <code>[GenerateAuthorizationHeaderCallback](#GenerateAuthorizationHeaderCallback)</code> - The callback that is called when the authorization header has been generated.  

**Example**  
```js
var claims = {iss: 'name-of-client', sub: 'name-of-client', aud: 'name-of-server'};
var options = {privateKey: 'a-private-key', kid: 'name-of-client/key-id.pem'};
generator.generateAuthorizationHeader(claims, options, function (error, headerValue) {
    if (error) {
        console.log('Generating authorization header failed.', error);
    } else {
        console.log(headerValue); // -> "Bearer [token]"
    }
});
```

<a name="Validator"></a>
#class: Validator
**Members**

* [class: Validator](#Validator)
  * [validator.validate(jwtToken, authorizedSubjects, callback)](#Validator#validate)

<a name="Validator#validate"></a>
##validator.validate(jwtToken, authorizedSubjects, callback)
Validates a jwt token.
The public key used for validation is retrieved from the configured
`publicKeyServer` based on the issuer of the token.

**Params**

- jwtToken `String` - The jwt token to validate.  
- authorizedSubjects `Array.<String>` - list of authorized subjects to access the service  
- callback <code>[ValidateCallback](#ValidateCallback)</code> - The callback that is called when the validate has been completed.  

**Example**  
```js
validator.validate(token, authorizedSubjects, function (error, claims) {
    if (error) {
        console.log('Token validation failed.', error);
    } else {
        console.log(claims); // -> "{iss: 'name-of-client', sub: 'name-of-client'}"
    }
});
```

<a name="getKey"></a>
#getKey(keyId)
Provides a Key for a validated key identifier.

**Params**

- keyId `String` - key identifier  

**Returns**: `String` - the relevant key if found  
<a name="getKey"></a>
#getKey(keyId)
Provides a Key for a validated key identifier.

**Params**

- keyId `String` - key identifier  

**Returns**: `String` - the relevant key if found  
<a name="TIME_CLAIM_LEEWAY"></a>
#TIME_CLAIM_LEEWAY
The JWT spec says that implementers "MAY provide for some small leeway, usually no more than a few minutes,
to account for clock skew". Calculations of the current time for the purposes of accepting or rejecting time-based
claims (e.g. "exp" and "nbf") will allow for the current time being plus or minus this leeway, resulting in
some time-based claims that are marginally before or after the current time being accepted instead of rejected.

<a name="GenerateTokenCallback"></a>
#callback: GenerateTokenCallback
**Params**

- error `Error` - The error if generating the token fails, else `null`.  
- token `String` - The generated token.  

**Type**: `function`  
<a name="GenerateAuthorizationHeaderCallback"></a>
#callback: GenerateAuthorizationHeaderCallback
**Params**

- error `Error` - The error if generating the authorization header fails, else `null`.  
- authorizationHeader `String` - The generated authorization header value.  

**Type**: `function`  
<a name="next"></a>
#callback: next
**Type**: `function`  
<a name="JWTAuthMiddlewareCallback"></a>
#callback: JWTAuthMiddlewareCallback
**Params**

- request `Object` - http request  
- response `Object` - http response  
- next <code>[next](#next)</code> - function to call the next middleware  

**Type**: `function`  
<a name="ValidateCallback"></a>
#callback: ValidateCallback
**Params**

- error `Error` - The error if the token is not valid or is not able to be validated, else `null`.  
- claims `Object` - The claims contained within the token.  

**Type**: `function`  
