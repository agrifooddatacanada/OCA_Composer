/**
 * @jest-environment jsdom
 *
 * Baseline ("characterization") snapshots for the manual-creation export path of
 * src/hooks/useOCAExport.js.
 *
 * Purpose: Tier 1 of the MCP work extracts the DSL / extension / package-assembly
 * logic out of this React hook. These snapshots were recorded BEFORE that change,
 * so any behavioral drift in the extraction shows up as a snapshot diff.
 *
 * What is real: the hook, MultiSchemaProvider, OCA DSL generation, extension overlay
 * generation, reference rewriting, and oca_package.
 * What is stubbed: the hosted OCA bundle API (replaced by a deterministic fake that
 * echoes the DSL's ADD ATTRIBUTE line back as a bundle) and browser-only helpers.
 *
 * If a snapshot changes intentionally, review the diff carefully before updating it.
 */
import "./setupGlobals";
import React from "react";
import crypto from "crypto";
import { renderHook, act } from "@testing-library/react";
import { Context } from "../../src/App";
import { MultiSchemaProvider, useMultiSchema } from "../../src/schema/schemaContext";
import useOCAExport from "../../src/hooks/useOCAExport";
import { overlayItems } from "../../src/constants/constants";
import {
  getPackageBundleId,
  mapLinkMLToOCABundle,
  transformToPackage
} from "@oca-composer/oca-core";
import { allFixtures } from "./fixtures/editorStates";
import examplePackage from "../../packages/oca-core/tests/fixtures/Package_example.json";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));

jest.mock("../../src/App", () => {
  // eslint-disable-next-line global-require
  const ReactActual = require("react");
  return { Context: ReactActual.createContext({}) };
});

jest.mock("../../src/hooks/useSessionDraft", () => ({
  clearDraft: jest.fn(),
  saveDraft: jest.fn(),
  loadDraft: jest.fn(() => null)
}));

jest.mock("../../src/ViewSchema/useGenerateTextReadmeFromJson", () => ({
  __esModule: true,
  default: () => ({ jsonToTextFile: jest.fn() })
}));

let mockUuidCounter = 0;
jest.mock("uuid", () => ({
  v4: () => {
    mockUuidCounter += 1;
    return `uuid-${mockUuidCounter}`;
  }
}));

const digestOf = (text) =>
  `E${crypto.createHash("sha256").update(text).digest("base64url").slice(0, 43)}`;

/** Parses `NAME=TYPE` pairs from the ADD ATTRIBUTE line of the DSL. */
const parseAttributes = (dsl) => {
  const line = dsl.split("\n").find((l) => l.startsWith("ADD ATTRIBUTE")) || "";
  const attributes = {};
  const pairRegex = /\s((?:\\.|[^\s=\\])+)=("(?:\\.|[^"\\])*"|\S+)/g;
  let match = pairRegex.exec(line.slice("ADD ATTRIBUTE".length));
  while (match) {
    attributes[match[1].replace(/\\(.)/g, "$1")] = match[2].replace(/^"|"$/g, "");
    match = pairRegex.exec(line.slice("ADD ATTRIBUTE".length));
  }
  return attributes;
};

const installFakeBundleApi = () => {
  const bundlesBySaid = {};
  const submittedDsl = [];

  const respond = (body) => ({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: () => "application/json" },
    json: async () => body,
    text: async () => JSON.stringify(body)
  });

  global.fetch = jest.fn(async (url, options = {}) => {
    const { pathname } = new URL(url);
    if (options.method === "POST" && pathname === "/oca-bundles") {
      const dsl = String(options.body);
      submittedDsl.push(dsl);
      const said = digestOf(dsl);
      bundlesBySaid[said] = {
        v: "OCAB10JSON000000_",
        d: said,
        capture_base: {
          d: digestOf(`capture_base:${dsl}`),
          type: "spec/capture_base/1.0",
          classification: "",
          attributes: parseAttributes(dsl),
          flagged_attributes: []
        },
        overlays: {}
      };
      return respond({ success: true, said });
    }
    if ((options.method || "GET") === "GET" && pathname.startsWith("/oca-bundles/")) {
      return respond(bundlesBySaid[pathname.split("/").pop()]);
    }
    throw new Error(`Unexpected request in fake bundle API: ${options.method} ${url}`);
  });

  return { submittedDsl };
};

const renderExport = () => {
  const contextValue = {
    customIsos: {},
    overlay: { ...overlayItems },
    setSummaryExportMode: jest.fn(),
    setOverlay: jest.fn(),
    setSelectedOverlay: jest.fn(),
    setCurrentPage: jest.fn()
  };
  // eslint-disable-next-line react/prop-types
  const wrapper = ({ children }) =>
    React.createElement(
      Context.Provider,
      { value: contextValue },
      React.createElement(MultiSchemaProvider, null, children)
    );
  return renderHook(
    () => ({ exporter: useOCAExport(), multiSchema: useMultiSchema() }),
    { wrapper }
  );
};

describe("useOCAExport manual export baseline", () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    mockUuidCounter = 0;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    delete global.fetch;
  });

  Object.entries(allFixtures).forEach(([name, makeFixture]) => {
    test(`${name}: DSL and exported package`, async () => {
      const { submittedDsl } = installFakeBundleApi();
      const { schemaId, state } = makeFixture();
      const { result } = renderExport();

      act(() => {
        result.current.multiSchema.restoreDraft({
          schemaStates: { [schemaId]: state },
          currentSchemaId: schemaId
        });
      });

      let exported;
      await act(async () => {
        exported = await result.current.exporter.exportData({ download: false });
      });

      expect(result.current.exporter.error).toBe("");
      expect(submittedDsl).toHaveLength(1);
      expect(submittedDsl[0]).toMatchSnapshot("dsl");
      expect(exported).toMatchSnapshot("package");
    });
  });
});

const linkmlTrialSchema = {
  name: "poultry_trial",
  description: "Broiler feeding trial",
  slots: {
    bird_id: {
      range: "string",
      required: true,
      pattern: "^[A-Z]{2}[0-9]{3}$",
      description: "Bird identifier"
    },
    live_weight: {
      range: "decimal",
      minimum_value: 0,
      maximum_value: 5000,
      unit: { ucum_code: "g" }
    },
    treatment: { range: "TreatmentEnum", required: true }
  },
  enums: {
    TreatmentEnum: {
      permissible_values: {
        CTRL: { description: "Control diet" },
        HIGH: { description: "High-protein diet" }
      }
    }
  },
  classes: { Bird: { slots: ["bird_id", "live_weight", "treatment"] } }
};

const importedFixtures = {
  examplePackage: () => JSON.parse(JSON.stringify(examplePackage)),
  linkmlWithEnum: () => transformToPackage(mapLinkMLToOCABundle(linkmlTrialSchema))
};

describe("useOCAExport imported export baseline", () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    mockUuidCounter = 0;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    delete global.fetch;
  });

  Object.entries(importedFixtures).forEach(([name, makePackage]) => {
    test(`${name}: DSL and exported package`, async () => {
      const { submittedDsl } = installFakeBundleApi();
      const pkg = makePackage();
      const { result } = renderExport();

      // Same sequence as useHandleSchemaFileDrop after a package or LinkML upload.
      act(() => {
        result.current.multiSchema.setOcaPackage(pkg);
        result.current.multiSchema.loadAllSchemasFromOcaPackage(pkg);
        result.current.multiSchema.switchToSchema(getPackageBundleId(pkg), pkg);
      });

      let exported;
      await act(async () => {
        exported = await result.current.exporter.exportData({ download: false });
      });

      expect(result.current.exporter.error).toBe("");
      expect(submittedDsl.length).toBeGreaterThan(0);
      expect(submittedDsl).toMatchSnapshot("dsl");
      expect(exported).toMatchSnapshot("package");
    });
  });
});
