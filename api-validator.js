'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    ApiValidator = function (list) {
        lodash.map(list, singleValidator);
    },
    loopValidator = function (list) {
    },
    singleValidator = function (data) {
        
    };

module.exports = ApiValidator;
