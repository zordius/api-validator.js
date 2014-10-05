/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    when = require('when'),
    traverse = require('traverse'),
    fs = require('fs'),
    path = require('path'),

ARequest = {
    promiseAll: function (list) {
        return when.all(lodash.map(list, ARequest.promise));
    },
    one: function (D, cb) {
        if (!lodash.isFunction(cb)) {
            throw {
                error: [{
                    'type': 'input',
                    message: 'No callback for ARequest.one'
                }]
            };
        }

        if (!D) {
            return cb({
                error: [{
                    'type': 'input',
                    message: 'No input for ARequest.one'
                }]
            });
        }

        if (!D.url) {
            return cb({
                error: [{
                    'type': 'input',
                    message: 'No input.url for ARequest.one'
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
            cb(ARequest.one(D));
        });
    },
    promise: function (D) {
        return when.promise(function (resolve) {
            ARequest.one(D, function (E) {
                resolve(E);
            });
        });
    }
};

module.exports = ARequest;
