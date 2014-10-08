REPORTER = dot

test:
		@NODE_ENV=test mocha --reporter $(REPORTER)

test-cov: 
		@JS_COV=1 $(MAKE) test REPORTER=html-cov > test/output/coverage.html

prepare-cov:
		@jscoverage src test/src-cov

.PHONY: test