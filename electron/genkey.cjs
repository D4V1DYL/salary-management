#!/usr/bin/env node
// DM Tech — activation key generator (developer tool, NOT shipped in the app).
//
// A client reads their "Kode Perangkat" (device code) off the activation
// screen and sends it to you. You run:
//
//     node electron/genkey.cjs "BCED 2DEA BCE8 E8CE 3C29 578A"
//
// and give them the printed activation key. It only unlocks that one
// machine — a different machine produces a different code and needs its
// own key (that is the "transfer license" path).
const { deriveLicenseKey, normalizeKey } = require("./license-config.cjs");

const input = process.argv.slice(2).join(" ").trim();
if (!input) {
  console.error('Usage: node electron/genkey.cjs "<device code>"');
  process.exit(1);
}

console.log("");
console.log("  Device code   :", normalizeKey(input).replace(/(.{4})/g, "$1 ").trim());
console.log("  Activation key :", deriveLicenseKey(input));
console.log("");
