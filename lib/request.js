/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    REQ = require('request'),
    when = require('when'),

ARequest = {
    one: function (D, cb) {
        if (!lodash.isFunction(cb)) {
            throw {
                error: [{
                    'type': 'input',
                    message: 'No callback for ARequest.one'
                }],
                response: undefined,
                body: undefined
            };
        }

        if (!D) {
            return cb({
                error: [{
                    'type': 'input',
                    message: 'No input for ARequest.one'
                }],
                response: undefined,
                body: undefined
            });
        }

        if (!D.url) {
            return cb({
                error: [{
                    'type': 'input',
                    message: 'No input.url for ARequest.one'
                }],
                response: undefined,
                body: undefined
            });
        }

        REQ(D, function (E, R, B) {
            var err = E ? [
                    {
                        'type': 'request',
                        message: E.message
                    }
                ] : [];

            cb({
               error: err,
               response: R,
               body: B
            });
        });
    },
    promise: function (D) {
        return when.promise(function (resolve) {
            ARequest.one(D, function (E) {
                resolve(E);
            });
        });
    },
    promiseAll: function (list) {
        return when.all(lodash.map(list, ARequest.promise));
    }
};

module.exports = ARequest;
