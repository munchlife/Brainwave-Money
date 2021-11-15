
TESTS ?= $(shell find test/ -name "*.test.js")

MOCHA = ./node_modules/.bin/mocha
_MOCHA = ./node_modules/.bin/_mocha
REPORTER ?= spec

ISTANBUL = ./node_modules/.bin/istanbul
REPORT ?= lcov

DEBUG_ENV = munch:verbose:config:service:1000

# Unit tests
test:
	@NODE_ENV=test DEBUG=$(DEBUG_ENV) $(MOCHA) --ui bdd --check-leaks --reporter $(REPORTER) $(TESTS)

# Code coverage
test-cov:
	@NODE_ENV=test DEBUG=$(DEBUG_ENV) $(ISTANBUL) cover $(_MOCHA) --report $(REPORT) -- --ui bdd --check-leaks --reporter $(REPORTER) $(TESTS)

.PHONY: test-cov test
