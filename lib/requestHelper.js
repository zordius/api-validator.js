/*jslint node: true */
'use strict';

var lodash = require('lodash');

module.exports = function (req, cfg) {
    if (!req.qs) {
        req.qs = {}
    }
    if (req.yql) {
        lodash.map(req.yqlConfig.qs, function (V, K) {
            req.qs[K] = V;
        });
        req.url = req.yqlConfig.endpoint;
        req.qs.q = req.yql;
        delete req.yql;
        delete req.yqlConfig;
    }
    return req;
};
