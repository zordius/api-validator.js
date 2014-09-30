'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    when = require('when');
    
module.exports = {
    ApiValidator: function (list, cb) {
        lodash.map(list, this.promiseValidator, this);
    },
    loopValidator: function (list) {
        lodash.map(list, this.singleValidator, this);
    },
    singleValidator: function (D) {
        var E;

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

        return E.validate(D.schema, D.data);
    }
}
