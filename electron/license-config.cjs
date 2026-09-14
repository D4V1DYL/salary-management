// Shared licensing constants + pure key math. Required by BOTH the running
// app (electron/main.cjs) and the offline key generator (electron/genkey.cjs)
// so the two can never drift out of sync.
//
// ⚠️  Before shipping to a client, change LICENSE_SECRET to a private random
//     string and keep it secret — anyone who knows it can mint valid keys.
const crypto = require("node:crypto");

const APP_SALT = "dmtech-payroll::device-lock::v1";
const LICENSE_SECRET = "dmtech-payroll::license-hmac::v1::CHANGE-ME-BEFORE-SHIP";

/** How long the free trial lasts, in days. */
const TRIAL_DAYS = 14;

/** Strip spaces/dashes and upper-case, so "bced-2dea" == "BCED 2DEA". */
function normalizeKey(s) {
  return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * The activation key for a given device code. Deterministic:
 * HMAC-SHA256(secret, deviceCode) → first 16 hex chars → XXXX-XXXX-XXXX-XXXX.
 * DM Tech runs this (via genkey.cjs) against a client's device code to
 * produce the key that unlocks the full (non-trial) license on that machine.
 */
function deriveLicenseKey(deviceCode) {
  const mac = crypto
    .createHmac("sha256", LICENSE_SECRET)
    .update(normalizeKey(deviceCode))
    .digest("hex")
    .toUpperCase();
  return (mac.slice(0, 16).match(/.{1,4}/g) || []).join("-");
}

module.exports = { APP_SALT, LICENSE_SECRET, TRIAL_DAYS, normalizeKey, deriveLicenseKey };
