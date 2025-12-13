const yaml = require('js-yaml');
const fs = require('fs');
const { mapLinkMLToOCABundle } = require('./src/SchemaTranslator/mapLinkMLToOCABundle.js');
const { transformToPackage } = require('./src/SchemaTranslator/linkMLToOCA.js');

const yamlContent = fs.readFileSync('./dummyData/yaml/linkml.yaml', 'utf8');
const linkmlSchema = yaml.load(yamlContent);
const bundle = mapLinkMLToOCABundle(linkmlSchema);
const ocaPackage = transformToPackage(bundle);

console.log('=== OCA Package Structure ===');
console.log('capture_base.d:', ocaPackage.oca_bundle.bundle.capture_base.d);
console.log('capture_base.type:', ocaPackage.oca_bundle.bundle.capture_base.type);
console.log('capture_base.language:', ocaPackage.oca_bundle.bundle.capture_base.language);
console.log('');
console.log('=== Attributes ===');
console.log('Has attributes:', !!ocaPackage.oca_bundle.bundle.capture_base.attributes);
console.log('Number of attributes:', Object.keys(ocaPackage.oca_bundle.bundle.capture_base.attributes || {}).length);
console.log('Attribute names:', Object.keys(ocaPackage.oca_bundle.bundle.capture_base.attributes || {}));
console.log('');
console.log('=== Overlays ===');
console.log('Available overlays:', Object.keys(ocaPackage.oca_bundle.bundle.overlays || {}));
console.log('');
console.log('=== Full Package (first 2000 chars) ===');
console.log(JSON.stringify(ocaPackage, null, 2).substring(0, 2000));
