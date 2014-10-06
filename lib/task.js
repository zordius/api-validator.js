/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    request = require('./request'),
    save = require('./save'),
    when = require('when'),

ATask = {
    fetch: function (L, opts) {
        request.all(L, function (D) {
            opts.callback(save.all(D, opts));
        });
    }
};

module.exports = ATask;
