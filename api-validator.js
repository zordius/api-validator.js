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
    ApiValidator: function (list, cb) {
        lodash.map(list, this.promiseValidator, this);
    },
    all: function (list) {
        if (!lodash.isArray(list)) {
            return {
                error: [{
                    'type': 'input',
                    message: 'Input is not array for all'
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
                    message: 'No input for one'
                }]
            };
        }

        if (!D.schema) {
            return {
                error: [{
                    'type': 'input',
                    message: 'No schema in input for one'
                }]
            };
        }

        E = jjv();
        err = E.validate(D.schema, D.data);

        return err ? {error: lodash.map(err.validation, this.normalizeError, this)} : null;
    }
};

module.exports = AValidator;
