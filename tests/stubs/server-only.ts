/**
 * What `import 'server-only'` resolves to inside the test run, and nowhere
 * else (tests/tsconfig.json maps it here; playwright.config.ts points the run
 * at that file). In the app, Next resolves the import itself, to a module that
 * fails the build if a client bundle pulls the file in. Node has no such
 * package, so without this the specs could not import the server-only modules
 * they unit-test (src/lib/env.ts, src/lib/contact-email.ts).
 */
export {}
