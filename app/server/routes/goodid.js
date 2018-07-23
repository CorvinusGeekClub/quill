const express = require('express');
const router = express.Router();

let UserController = require('../controllers/UserController');

const crypto = require('crypto');
const fs = require('fs');
const jose = require('node-jose');
const {Issuer} = require('openid-client');

const keystore = jose.JWK.createKeyStore();
let client = null,
    defaultRequest = null;

// ---------------------------------------------
// TODO: NEED TO CONFIGURE
// ---------------------------------------------
const clientName = 'JUNCTIONxBudapest';
const clientId = process.env.GOODID_CLIENT_ID;
const clientSecret = process.env.GOODID_CLIENT_SECRET;
const signingKeyPath = 'etc/goodid-sig_key.pem';
const encryptingKeyPath = 'etc/goodid-enc_key.pem';
const claims = {
    "id_token": {},
    "userinfo": {
        "name": {
            "essential": true
        },
        "family_name": {
            "essential": true
        },
        "given_name": {
            "essential": true
        },
        "email": {
            "essential": true
        },
        "email_verified": {
            "value": true
        }
    }
};
const routePrefix = process.env.ROOT_URL + '/_goodid';
// -----------------------------------------------
// TODO: ^^^
// -----------------------------------------------

const idpDomain = 'https://idp.goodid.net';

// Initialize keystore
const encKey = fs.readFileSync(encryptingKeyPath);
const sigKey = fs.readFileSync(signingKeyPath);
let p = keystore
    .add(sigKey, 'pem', {use: 'sig', kid: 'sig01'})
    .then(function () {
        return keystore.add(encKey, 'pem', {use: 'enc', kid: 'enc01'})
    });

// Setup openid-connect client
p = p.then(function () {
    const goodidIssuer = new Issuer({
        issuer: 'https://goodid.net',
        authorization_endpoint: idpDomain + '/oidc/authorize',
        token_endpoint: idpDomain + '/oidc/token',
        userinfo_endpoint: idpDomain + '/oidc/userinfo',
        jwks_uri: idpDomain + '/jwks'
    });
    console.log('Set up issuer %s', goodidIssuer);

    client = new goodidIssuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        request_object_signing_alg: 'RS256',
        id_token_signed_response_alg: 'ES256',
        id_token_encrypted_response_alg: 'RSA-OAEP',
        id_token_encrypted_response_enc: 'A256CBC-HS512',
        userinfo_signed_response_alg: 'ES256',
        userinfo_encrypted_response_alg: 'RSA-OAEP',
        userinfo_encrypted_response_enc: 'A256CBC-HS512'
    }, keystore);

    return Promise.resolve(client);
});

// Create default request object
p = p.then(function (client) {
    client.requestObject({
        aud: idpDomain + '/',
        response_type: 'code',
        redirect_uri: routePrefix + '/login',
        scope: 'openid',
        claims: claims
    }, {
        sign: client.request_object_signing_alg
    }).then(function (request) {
        defaultRequest = request;
    });
});

router.get('/jwks', function (req, res, next) {
    res
        .set('Content-Type', 'application/jwk-set+json')
        .send(keystore.toJSON());
});

router.get('/default-request', function (req, res, next) {
    res
        // .set('Content-Type', 'application/jwt')
        .set('Content-Type', 'text/plain')
        .send(defaultRequest);
});

router.get('/initiate-login', function (req, res, next) {
    // Generate state and nonce
    req.session.state = crypto.randomBytes(64).toString('hex');
    req.session.nonce = crypto.randomBytes(64).toString('hex');

    const url = client.authorizationUrl({
        request: defaultRequest,
        state: req.session.state,
        nonce: req.session.nonce
    });
    req.session.save(function (err) {
        res.redirect(url);
    });
});

router.get('/initiate-fast-login', function (req, res, next) {
    // Generate state and nonce
    req.session.state = crypto.randomBytes(64).toString('hex');
    req.session.nonce = crypto.randomBytes(64).toString('hex');

    res.set('Content-Type', 'application/json');
    const url = `${idpDomain}/fast/authorize?client_id=${clientId}&state=${req.session.state}&nonce=${req.session.nonce}&ext=${req.query.ext}`;
    res.redirect(url);
});

router.get('/login', function (req, res, next) {
    const check = {
        state: req.session.state,
        nonce: req.session.nonce
    };

    // Regenerate state and nonce to prevent replay.
    req.session.state = crypto.randomBytes(64).toString('hex');
    req.session.nonce = crypto.randomBytes(64).toString('hex');

    client
        .authorizationCallback(routePrefix + '/login', req.query, check)
        .then(function (tokenSet) {
            client.userinfo(tokenSet.access_token)
                .then(function (userinfo) {
                    console.log('userinfo %j', userinfo);

                    UserController.createUserGoodID(
                        userinfo.claims.email,
                        userinfo.claims.name,
                        function(error, data) {
                            if (error) {
                                res.status(500).send(error);
                            }
                            // Begin questionable code - this could be an angularjs view?
                            // Encoding: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
                            function b64EncodeUnicode(str) {
                                // first we use encodeURIComponent to get percent-encoded UTF-8,
                                // then we convert the percent encodings into raw bytes which
                                // can be fed into btoa.
                                return Buffer.from(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                                    function toSolidBytes(match, p1) {
                                        return String.fromCharCode('0x' + p1);
                                })).toString('base64');
                            }

                            let response = `
                                <html>
                                <p>Redirecting...</p>
                                <script>
                                    function b64DecodeUnicode(str) {
                                        // Going backwards: from bytestream, to percent-encoding, to original string.
                                        return decodeURIComponent(atob(str).split('').map(function(c) {
                                            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                                        }).join(''));
                                    }

                                    localStorage.setItem('jwt', b64DecodeUnicode('${b64EncodeUnicode(data.token)}'));
                                    localStorage.setItem('currentUser', b64DecodeUnicode('${b64EncodeUnicode(JSON.stringify(data.user))}'));
                                    localStorage.setItem('userId', b64DecodeUnicode('${b64EncodeUnicode(data.user._id)}'));
                                    window.location.replace('${process.env.ROOT_URL}');
                                </script>
                                </html>
                            `
                            res.set('Content-Type', 'text/html');
                            res.send(response);
                            // End questionable code
                        }
                    );

                    /*
                    TODO: Your should handle the received userinfo here.
                    Sub is the user identifier, claims contains the requested user data.
                     */


                });
        })
        .catch(function (error) {
            console.error(error);

            res.status(500).send(error);
        });
});

module.exports = router;
