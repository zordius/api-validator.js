/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    REQ = require('request'),
    async = require('async'),

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
               input: D,
               error: err,
               request: req,
               response: R,
               body: B
            });
        });
    },
    all: function (list, cfg, cb) {
        var concurrency = cfg.concurrency || 2,
            verbose = cfg.verbose > 1;

        async.parallelLimit(lodash.map(list, function (R, I) {
            return function (done) {
                if (verbose) {
                    console.warn('Request.one #' + (I + 1) + ': ' + R.url);
                }
                ARequest.one(R, function (D) {
                    done(null, D);
                });
            };
        }), concurrency, function (err, R) {
            cb(R);
        });
    }
};

module.exports = ARequest;
