/**
 * Schema Translator Utilities
 *
 * Utility functions for schema translation
 */

/**
 * Generate a simple hash for an object
 * This is a placeholder - in a real implementation you would use a proper
 * hash function like SHA-256, but this keeps dependencies minimal
 *
 * @param {Object} obj - Object to hash
 * @returns {string} Simple hash string
 */
export function generateSimpleHash(obj) {
  const str = JSON.stringify(obj);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash * 31 + char) % 0x100000000; // Use a safer hash calculation
  }

  return Math.abs(hash).toString(16);
}

/**
 * Process an OCA bundle to add digests (hashes) to all layers
 *
 * @param {Object} bundle - OCA bundle
 * @returns {Object} OCA bundle with digests
 */
export function addDigests(bundle) {
  // Clone the bundle to avoid modifying the original
  const result = JSON.parse(JSON.stringify(bundle));

  // Add digest to capture_base
  if (result.capture_base) {
    // Temporarily remove the digest field for hashing
    const tempCB = { ...result.capture_base };
    delete tempCB.digest;

    // Generate and set the digest
    result.capture_base.digest = generateSimpleHash(tempCB);
  }

  // Add digest to overlays
  if (result.overlays) {
    // Process each overlay type
    Object.keys(result.overlays).forEach((overlayType) => {
      const overlay = result.overlays[overlayType];

      // Handle array of overlays (like meta, information, label)
      if (Array.isArray(overlay)) {
        overlay.forEach((item, index) => {
          // Temporarily remove the digest field for hashing
          const tempItem = { ...item };
          delete tempItem.digest;

          // Generate and set the digest
          result.overlays[overlayType][index].digest = generateSimpleHash(tempItem);
        });
      }
      // Handle single overlay object (like character_encoding, format)
      else if (overlay && typeof overlay === "object") {
        // Temporarily remove the digest field for hashing
        const tempItem = { ...overlay };
        delete tempItem.digest;

        // Generate and set the digest
        result.overlays[overlayType].digest = generateSimpleHash(tempItem);
      }
    });
  }

  return result;
}

/**
 * Create a meta.json file content for an OCA Bundle
 *
 * @param {Object} bundle - OCA bundle with digests
 * @returns {Object} meta.json content
 */
export function createMetaJson(bundle) {
  const captureBaseDigest = bundle.capture_base.digest;
  const files = {
    [captureBaseDigest]: {}
  };

  // Add each overlay digest to the meta.json
  Object.keys(bundle.overlays).forEach((overlayType) => {
    const overlay = bundle.overlays[overlayType];

    // Handle array of overlays (like meta, information, label)
    if (Array.isArray(overlay)) {
      overlay.forEach((item) => {
        const language = item.language ? `(${item.language})` : "";
        files[captureBaseDigest][`${overlayType}${language}`] = item.digest;
      });
    }
    // Handle single overlay object (like character_encoding, format)
    else if (overlay && typeof overlay === "object") {
      files[captureBaseDigest][overlayType] = overlay.digest;
    }
  });

  return {
    files,
    root: captureBaseDigest
  };
}

export default {
  generateSimpleHash,
  addDigests,
  createMetaJson
};
