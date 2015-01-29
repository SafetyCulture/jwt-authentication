#Index

**Modules**

* [jwt-microservice-helper](#module_jwt-microservice-helper)
  * [jwt-microservice-helper.create(config)](#module_jwt-microservice-helper.create)

**Classes**

* [class: JwtHelper](#JwtHelper)
  * [jwtHelper.validate(jwtToken, callback)](#JwtHelper#validate)
  * [jwtHelper.generateToken(claims, options, callback)](#JwtHelper#generateToken)
  * [jwtHelper.generateAuthorizationHeader(claims, options, callback)](#JwtHelper#generateAuthorizationHeader)

**Typedefs**

* [callback: ValidateCallback](#ValidateCallback)
* [callback: GenerateTokenCallback](#GenerateTokenCallback)
* [callback: GenerateAuthorizationHeaderCallback](#GenerateAuthorizationHeaderCallback)
 
<a name="module_jwt-microservice-helper"></a>
#jwt-microservice-helper
<a name="module_jwt-microservice-helper.create"></a>
##jwt-microservice-helper.create(config)
Constructor of `JwtHelper` objects.

**Params**

- config `Object`  
  - publicKeyServer `String` - A base url for the server containing the public keys of the issuers of the tokens.  

**Returns**: [JwtHelper](#JwtHelper)  
**Example**  
```js
var jwtMicroserviceHelper = require('jwt-microservice-helper');
var jwtHelper = jwtMicroserviceHelper.create({publicKeyServer: 'https://server.com'});
```

<a name="JwtHelper"></a>
#class: JwtHelper
**Members**

* [class: JwtHelper](#JwtHelper)
  * [jwtHelper.validate(jwtToken, callback)](#JwtHelper#validate)
  * [jwtHelper.generateToken(claims, options, callback)](#JwtHelper#generateToken)
  * [jwtHelper.generateAuthorizationHeader(claims, options, callback)](#JwtHelper#generateAuthorizationHeader)

<a name="JwtHelper#validate"></a>
##jwtHelper.validate(jwtToken, callback)
Validates a jwt token.
The public key used for validation is retrieved from the configured
`publicKeyServer` based on the issuer of the token.

**Params**

- jwtToken `String` - The jwt token to validate.  
- callback <code>[ValidateCallback](#ValidateCallback)</code> - The callback that is called when the validate has been completed.  

**Example**  
```js
jwtHelper.validate(token, function (error, claims) {
    if (error) {
        console.log('Token validation failed.', error);
    } else {
        console.log(claims); // -> "{iss: 'name-of-client', sub: 'name-of-client'}"
    }
});
```

<a name="JwtHelper#generateToken"></a>
##jwtHelper.generateToken(claims, options, callback)
Generates a jwt token.

**Params**

- claims `Object` - The claims to be included in the token. Custom claims are permitted.  
  - iss `String` - Issuer. The name of the system issuing the token.
This name should match the name of a key in the `publicKeyServer`.  
  - sub `String` - Subject. The name of the system the token is for.
If the subject is generating tokens for itself the `sub` and `iss` should be the same.  
- options `Object`  
  - privateKey `String` - The private key to use when generating the token.  
- callback <code>[GenerateTokenCallback](#GenerateTokenCallback)</code> - The callback that is called when the token has been generated.  

**Example**  
```js
var claims = {iss: 'name-of-client', sub: 'name-of-client'};
var options = {privateKey: 'a-private-key'};
jwtHelper.generateToken(claims, options, function (error, token) {
    if (error) {
        console.log('Generating token failed.', error);
    } else {
        console.log(token); // -> "[token]"
    }
});
```

<a name="JwtHelper#generateAuthorizationHeader"></a>
##jwtHelper.generateAuthorizationHeader(claims, options, callback)
Generates an authorization header value containing a jwt token.
The format of the value is `x-atl-jwt [token]`.

**Params**

- claims `Object` - The claims to be included in the token. Custom claims are permitted.  
  - iss `String` - Issuer. The name of the system issuing the token.
This name should match the name of a key in the `publicKeyServer`.  
  - sub `String` - Subject. The name of the system the token is for.
If the subject is generating tokens for itself the `sub` and `iss` should be the same.  
- options `Object`  
  - privateKey `String` - The private key to use when generating the token.  
- callback <code>[GenerateAuthorizationHeaderCallback](#GenerateAuthorizationHeaderCallback)</code> - The callback that is called when the authorization header has been generated.  

**Example**  
```js
var claims = {iss: 'name-of-client', sub: 'name-of-client'};
var options = {privateKey: 'a-private-key'};
jwtHelper.generateAuthorizationHeader(claims, options, function (error, headerValue) {
    if (error) {
        console.log('Generating authorization header failed.', error);
    } else {
        console.log(headerValue); // -> "x-atl-jwt [token]"
    }
});
```

<a name="ValidateCallback"></a>
#callback: ValidateCallback
**Params**

- error `Error` - The error if the token is not valid or is not able to be validated, else `null`.  
- claims `Object` - The claims contained within the token.  

**Type**: `function`  
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
