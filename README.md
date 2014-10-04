api-validator.js
================

A nodejs lib and command line tool powered by JSON Schema to validate web API output

[![Build Status](https://travis-ci.org/zordius/api-validator.js.svg?branch=master)](https://travis-ci.org/zordius/api-validator.js) [![Code Climate](https://codeclimate.com/github/zordius/api-validator.js/badges/gpa.svg)](https://codeclimate.com/github/zordius/api-validator.js) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

Features
--------

* JSON Schema V4 Draft Validation (powered by <a href="https://github.com/acornejo/jjv">jjv</a>)
 * load schema files
 * handle both remote $ref `http://...` or relative file $ref `file://../.`
* API Validation - fetch , save , validate , report **TODO**
 * describe API request and JSON Schema pairs by yaml file **TODO**
 * make API requests and save response as json files **TODO**
 * validate on these response **TODO**
 * output validation results (powered by <a href="https://github.com/visionmedia/mocha">mocha</a> reports. **TODO**
* Command line tool **TODO**
 * Validate your schema files **TODO**
 * List and fetch referenced remote schema files **TODO**
 * API Validation **TODO**
CommonJS Usage
--------------

**Validation**

```javascript
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

**Load Schema files**

```javascript
// result as { fileName1: schema1, fileName2: schema2, ... }
var schemas = AV.loadSchemaFiles(AV.findSchemaFiles('some/directory', /.+\.json/));
```

**Dereference `'$ref': 'file://..'`**

```javascript
// result as { 'file://path/file1': schema1, 'file://path:file2': schema2 ... }
// id in schema will be updated
// any '$ref' point to 'file://relative/path/another' in schema will be updated
var schemas = AV.loadRelativeSchemaFiles('some/directory', /.+\.json/));
```

