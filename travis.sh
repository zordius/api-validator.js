#!/bin/sh

echo "DEBUG ENV: ${TRAVIS_JOB_NUMBER} ${TRAVIS_BUILD_NUMBER} ..."

if [ "${TRAVIS_BUILD_NUMBER}.2" != "${TRAVIS_JOB_NUMBER}" ]; then
  echo "Only run sauce labs 1 time 1 commit... quit."
  exit 0
fi

# push coverage to codeclimate
npm run-script coverage
node_modules/.bin/codeclimate < coverage/lcov.info

# skip browser build, browser test and deploy when api-validator.js.js not changed.
CODEDIFF=`git show --name-only ${TRAVIS_COMMIT} |grep api-validator.js`
if [ -z "$CODEDIFF" ]; then
  echo api-validator.js is not changed, SKIP browser build/test and deploy.
  exit 0
fi

# build JS files for dist and test
npm install grunt grunt-cli grunt-contrib-connect grunt-saucelabs codeclimate-test-reporter

npm run-script lint && npm run-script build_std && npm run-script build_dbg && npm run-script build_min && npm run-script build_req && npm run-script build_tst

exit 0

# do sauce labs tests
node_modules/.bin/grunt || exit $?

# Setup git
git config --global user.name "Travis-CI"
git config --global user.email "zordius@yahoo-inc.com"

git add dist
git commit -m "Auto build dist files for ${TRAVIS_COMMIT} [ci skip]"

# push back dist files
git push "https://${GHTK}@github.com/zordius/api-validator.js.git" HEAD:${TRAVIS_BRANCH} > /dev/null 2>&1

# Mark this build to deploy
PUSH_NPM=1
export PUSH_NPM

# Bump npm version and push back to git
npm version prerelease -m "Auto commit for npm publish version %s [ci skip]"
git push "https://${GHTK}@github.com/zordius/api-validator.js.git" --tags > /dev/null 2>&1
