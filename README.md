api-validator.js
================

A nodejs lib and command line tool powered by JSON Schema to validate web API output

[![Build Status](https://travis-ci.org/zordius/api-validator.js.svg?branch=master)](https://travis-ci.org/zordius/api-validator.js) [![Code Climate](https://codeclimate.com/github/zordius/api-validator.js/badges/gpa.svg)](https://codeclimate.com/github/zordius/api-validator.js) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

CommonJS Usage
--------------

```javascript
// do one validation with data and schema
var AV = require('api-validator'),
    result;

// null means pass, or object with error information
result = AV.one({
    data: {abc: 123}
    schema: {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'type': 'object',
        required: ['abc', 'def'],
        properties: {
            abc: {
                type: 'string'
            },
            def: {}
        }
    }
});
```

