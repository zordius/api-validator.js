/*jslint node: true */
'use strict';

var lodash = require('lodash'),
    when = require('when'),
    fs = require('fs'),

ASave = {
    format: function (N, L) {
        var O = '0000000000' + N,
            S = lodash.isString(L) ? L.length : 4;

        return O.substr(O.length - S);
    },
    namer: function (I, D, opts) {
        var cfg = opts || {},
            prefix = cfg.prefix || 'file_',
            base = cfg.basedir || 'output',
            ext = cfg.ext || '.json';

        return base + '/' + prefix + (lodash.isNumber(I) ? ASave.format(I + 1, cfg.format) : encodeURIComponent(I)) + ext;
    },
    array: function (L, cb, opts) {
        var R = {},
            cfg = opts || {},
            namer = lodash.isFunction(cfg.namer) ? cfg.namer : ASave.namer;

        lodash.map(L, function (D, I) {
            var N = namer(I, D, opts);

            try {
            } catch (E) {
            }
        });
        return R;
    }
};

module.exports = ASave;
