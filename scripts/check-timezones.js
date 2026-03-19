#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const siteScriptPath = path.resolve(__dirname, '..', 'assets/js/site.js');

function extractSection(source, startMarker, endMarker) {
  const startIndex = source.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Start marker not found: ${startMarker}`);
  }

  const endIndex = source.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    throw new Error(`End marker not found: ${endMarker}`);
  }

  return source.slice(startIndex, endIndex);
}

function loadTimezoneResolver(source) {
  const timezonePrelude = extractSection(
    source,
    'const timezoneAliases = {',
    'function setLoaderSkipForNextNavigation()'
  );

  const canonicalTimezoneFunction = extractSection(
    source,
    'function getCanonicalTimezone(timezone) {',
    'function isValidTimezone(timezone) {'
  );

  const resolverBundle = [
    timezonePrelude,
    canonicalTimezoneFunction,
    'this.__timezoneCheck = { getCanonicalTimezone, timezoneAliases };'
  ].join('\n');

  const context = { Intl };
  vm.createContext(context);
  vm.runInContext(resolverBundle, context);

  return context.__timezoneCheck;
}

function runValidationChecks(getCanonicalTimezone, timezoneAliases) {
  const canEnumerateTimezones = typeof Intl.supportedValuesOf === 'function';

  if (!canEnumerateTimezones) {
    throw new Error('Intl.supportedValuesOf is unavailable. Use Node.js 20+ for full timezone checks.');
  }

  const supportedZones = Intl.supportedValuesOf('timeZone');
  const directFailures = supportedZones.filter((zone) => !getCanonicalTimezone(zone));
  const lowercaseFailures = supportedZones.filter((zone) => !getCanonicalTimezone(zone.toLowerCase()));
  const spacedFailures = supportedZones
    .map((zone) => zone.replace(/_/g, ' '))
    .filter((zone) => !getCanonicalTimezone(zone));
  const aliasFailures = Object.keys(timezoneAliases).filter((zone) => !getCanonicalTimezone(zone));

  const offsetSamples = ['UTC', 'GMT', 'Z', 'UTC+5', 'GMT+05:30', '+09:00', '-03:30'];
  const offsetResults = offsetSamples.map((input) => ({
    input,
    output: getCanonicalTimezone(input)
  }));

  return {
    checked: supportedZones.length,
    directFailures,
    lowercaseFailures,
    spacedFailures,
    aliasFailures,
    offsetResults
  };
}

function printSummary(results) {
  console.log(`supported zones checked: ${results.checked}`);
  console.log(`direct failures: ${results.directFailures.length}`);
  console.log(`lowercase failures: ${results.lowercaseFailures.length}`);
  console.log(`space-variant failures: ${results.spacedFailures.length}`);
  console.log(`legacy alias failures: ${results.aliasFailures.length}`);

  if (results.directFailures.length) {
    console.log(`direct failure sample: ${results.directFailures.slice(0, 10).join(', ')}`);
  }

  if (results.lowercaseFailures.length) {
    console.log(`lowercase failure sample: ${results.lowercaseFailures.slice(0, 10).join(', ')}`);
  }

  if (results.spacedFailures.length) {
    console.log(`space-variant failure sample: ${results.spacedFailures.slice(0, 10).join(', ')}`);
  }

  if (results.aliasFailures.length) {
    console.log(`alias failure sample: ${results.aliasFailures.slice(0, 10).join(', ')}`);
  }

  console.log('offset tests:');
  for (const result of results.offsetResults) {
    console.log(`  ${result.input} -> ${result.output}`);
  }
}

function main() {
  const source = fs.readFileSync(siteScriptPath, 'utf8');
  const { getCanonicalTimezone, timezoneAliases } = loadTimezoneResolver(source);
  const results = runValidationChecks(getCanonicalTimezone, timezoneAliases);

  printSummary(results);

  const hasFailures = results.directFailures.length > 0
    || results.lowercaseFailures.length > 0
    || results.spacedFailures.length > 0
    || results.aliasFailures.length > 0;

  if (hasFailures) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = 0;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`timezone check failed: ${message}`);
  process.exit(1);
}
