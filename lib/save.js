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
            ext = cfg.ext || '.json';

        return prefix + (lodash.isNumber(I) ? ASave.format(I + 1, cfg.format) : I) + ext;
    },
    jsonReplacer: function (K, V) {
        return V;
    },
    one: function (F, D, opts) {
        var cfg = opts ? opts : {},
            replacer = lodash.isFunction(cfg.replacer) ? cfg.replacer : ASave.jsonReplacer,
            space = lodash.isString(cfg.space) ? cfg.space : '    ';

        try {
            fs.writeFileSync(F, JSON.stringify(D, replacer, space), 'utf8');
            return;
        } catch (E) {
            return {
                error: [{
                    type: 'save',
                    message: E.message
                }]
            }
        }
    },
    all: function (L, opts) {
        var R = {},
            cfg = opts || {},
            namer = lodash.isFunction(cfg.namer) ? cfg.namer : ASave.namer;

        lodash.map(L, function (D, I) {
            var E = ASave.one(namer(I, D, cfg), D, cfg);
            if (E) {
console.log(E);
                R[I] = E;
            }
        });

        return R;
    }
};

module.exports = ASave;
