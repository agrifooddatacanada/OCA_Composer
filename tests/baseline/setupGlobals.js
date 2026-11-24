// jsdom does not provide TextEncoder/TextDecoder, which oca_package needs at load time.
// This module must be imported before anything that imports oca_package.
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === "undefined") global.TextDecoder = TextDecoder;
