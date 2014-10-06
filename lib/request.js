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
                request: {},
                response: undefined,
                body: undefined,
            };
        }

        if (!D) {
            return cb({
                error: [{
                    'type': 'input',
                    message: 'No input for ARequest.one'
                }],
                request: {},
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
                request: {},
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
                ] : [],
                req = (R && R.request) ? R.request : {};

            if (R) {
                delete R.request;
                delete req.response;
                delete req.httpModule;
                delete req.agent;
                delete req.req;
            }

            cb({
               error: err,
               request: req,
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
    },
    all: function (list, cb) {
        ARequest.promiseAll(list).then(function (D) {
            cb(D);
        });
    }
};

module.exports = ARequest;
