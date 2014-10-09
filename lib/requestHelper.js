/*jslint node: true */
'use strict';

module.exports = function (req, cfg) {
    if (!req.qs) {
        req.qs = {}
    }
    if (req.yql) {
        req.url = req.yqlConfig.endpoint;
        req.qs.q = req.yql;
        delete req.yql;
        delete req.yqlConfig;
    }
    return req;
};
