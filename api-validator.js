/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    when = require('when'),
    fs = require('fs'),

AValidator = {
    normalizeError: function (V, I) {
        return {
            type: 'validation',
            target: I,
            rule: V
        };
    },
    findSchemaFiles: function (base, match) {
        var F = [],
            D = base || process.cwd();

        try {
            fs.readdirSync(D).forEach(function (N) {
                var FN = D + '/' + N,
                    S = fs.statSync(FN);

                if (S.isDirectory()) {
                    lodash.map(AValidator.findSchemaFiles(FN), function (O) {
                        F.push(O);
                    });
                    return;
                }

                if (N.match(match || /(schema)?\.json$/)) {
                    F.push(FN);
                }
            });
        } catch (E) {
        }

        return F;
    },
    promiseAll: function (list) {
        return when.all(lodash.map(list, AValidator.promise));
    },
    request: function (D, cb) {
        if (!lodash.isFunction(cb)) {
            throw {
                error: [{
                    'type': 'input',
                    message: 'No callback for AValidator.request'
                }]
            };
        }

        if (!D) {
            return cb({
                error: [{
                    'type': 'input',
                    message: 'No input for AValidator.request'
                }]
            });
        }

        if (!D.url) {
            return cb({
                error: [{
                    'type': 'input',
                    message: 'No input.url for AValidator.request'
                }]
            });
        }

        D.json = true;

        REQ(D, function (E, R, B) {
            if (E) {
                return cb({
                    error: [{
                        'type': 'request',
                        message: E.message,
                        response: R,
                        body: B
                    }]
                });
            }

            D.data = B;
            cb(AValidator.one(D));
        });
    },
    promise: function (D) {
        return when.promise(function (resolve) {
            AValidator.request(D, function (E) {
                resolve(E);
            });
        });
    },
    all: function (list) {
        if (!lodash.isArray(list)) {
            return {
                error: [{
                    'type': 'input',
                    message: 'Input is not array for AValidator.all'
                }]
            };
        }

        return lodash.map(list, AValidator.one);
    },
    one: function (D) {
        var E, err;

        if (!D) {
            return {
                error: [{
                    'type': 'internal',
                    message: 'No input for AValidator.one'
                }]
            };
        }

        if (!D.schema) {
            return {
                error: [{
                    'type': 'input',
                    message: 'No schema in input for AValidator.one'
                }]
            };
        }

        E = jjv();
        err = E.validate(D.schema, D.data);

        return err ? {error: lodash.map(err.validation, AValidator.normalizeError)} : null;
    }
};

module.exports = AValidator;
