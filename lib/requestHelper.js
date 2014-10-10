/*jslint node: true */
'use strict';

var lodash = require('lodash');

module.exports = function (req, cfg) {
    if (req.yql) {
        req.url = req.yqlConfig.endpoint;
        delete req.yqlConfig.endpoint;

        req.yqlConfig.qs.q = req.yql;
        delete req.yql;

        lodash.map(req.yqlConfig, function (V, K) {
            req[K] = V;
        });
        delete req.yqlConfig;
    }
    return req;
};
