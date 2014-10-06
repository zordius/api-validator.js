/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),

AValidator = {
    normalizeError: function (V, I) {
        return {
            type: 'validation',
            target: I,
            rule: V
        };
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
        var E, err, M;

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

        if (D.schemas) {
            lodash.map(D.schemas, function (R, N) {
                E.addSchema(N, R);
            });
        }

        try {
            err = E.validate(D.schema, D.data);
        } catch (E) {
            M = E.toString().match(/could not find schema '(.+)'/)
            if (M) {
                return {
                    error: [{
                        'type': 'schemas',
                        message: 'can not find schema "' + M[1] + '"'
                    }]
                };
            }
            console.log(E);
        }

        return err ? {error: lodash.map(err.validation, AValidator.normalizeError)} : null;
    },
    selfVerify: function (schemas) {
        var R = {};
        lodash.map(schemas, function (C, N) {
            var X = AValidator.one({
                schemas: schemas,
                schema: C.$schema || schemas['core://default.api/strict#'],
                data: C
            });
            if (X) {
                R[N] = X;
            }
        });
        return R;
    }
};

module.exports = AValidator;
