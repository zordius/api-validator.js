/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    when = require('when'),

AValidator = {
    normalizeError: function (V, I) {
        return {
            type: 'validation',
            target: I,
            rule: V
        };
    },
    exec: function (list, cb) {
        lodash.map(list, this.promise, this);
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
                        message: E,
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

        return lodash.map(list, this.one, this);
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

        return err ? {error: lodash.map(err.validation, this.normalizeError, this)} : null;
    }
};

module.exports = AValidator;
