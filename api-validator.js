'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    when = require('when'),
    normalizeError = function (V, I) {
        return {
            type: 'validation',
            target: I,
            rule: V
        };
    };
    
module.exports = {
    ApiValidator: function (list, cb) {
        lodash.map(list, this.promiseValidator, this);
    },
    loopValidator: function (list) {
        if (!lodash.isArray(list)) {
            return {
                error: [{
                    'type': 'input',
                    message: 'Input is not array for loopValidator'
                }]
            };
        }

        return lodash.map(list, this.singleValidator, this);
    },
    singleValidator: function (D) {
        var E, err;

        if (!D) {
            return {
                error: [{
                    'type': 'internal',
                    message: 'No input for singleValidator'
                }]
            };
        }

        if (!D.schema) {
            return {
                error: [{
                    'type': 'input',
                    message: 'No schema in input for singleValidator'
                }]
            };
        }

        E = jjv();
        err = E.validate(D.schema, D.data);

        return err ? {error: lodash.map(err.validation, normalizeError)} : null;
    }
}
