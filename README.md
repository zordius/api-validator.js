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
 * output validation results (powered by <a href="https://github.com/visionmedia/mocha">mocha</a> reports) **TODO**
* Command line tool **TODO**
 * Validate your schema files **TODO**
 * List and fetch referenced remote schema files **TODO**
 * API Validation **TODO**

Command Line Usage
------------------

**Step 1. Make a plan**

```yaml
# plan.yaml
requestYaml: requests.yaml
```

**Step 2. List requests**

```yaml
# request.yaml
- url: http://apihost/endpoint1
  schema: schema_name1
- url: http://apihost/endpoint2
  schema: schema_name2
```

**Step 3. Validate!**

```sh
api-validator.js plan.yaml
```
