/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    when = require('when'),

ATask = {
    fetch: function (L, cb) {
    },
    all: function (list, cb) {
        ARequest.promiseAll(list).then(function (D) {
            cb(D);
        });
    }
};

module.exports = ATask;
