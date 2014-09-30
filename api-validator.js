'use strict';

var lodash = require('lodash'),
    jjv = require('jjv'),
    REQ = require('request'),
    when = require('when');
    
module.exports = {
    ApiValidator: function (list, cb) {
        lodash.map(list, this.promiseValidator, this);
    },
    loopValidator: function (list) {
        lodash.map(list, this.singleValidator, this);
    },
    singleValidator: function (data) {
        
    }
}
