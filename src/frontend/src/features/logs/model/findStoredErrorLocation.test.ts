import { describe, expect, it } from "vitest";
import {
  findStoredErrorLocation,
  type FetchElementChildren,
} from "./findStoredErrorLocation";
import type { FlowchartChildLog, FlowchartLog } from "./types";

const base = {
  executionId: "1",
  flowId: "f",
  connectorName: null,
  status: "COMPLETE" as const,
};

const op = (
  id: string,
  indexPath: string,
  message?: string,
): FlowchartChildLog => ({
  ...base,
  id,
  indexPath,
  type: "OPERATION",
  properties: { name: id },
  segment: {
    request: { url: "/", http_method: "GET" },
    response: { status: "200", duration: "1ms" },
  },
  error: message ? { message, stack_trace: [] } : null,
});

const loop = (
  id: string,
  indexPath: string,
  size: number,
): FlowchartChildLog => ({
  ...base,
  id,
  indexPath,
  type: "LOOP",
  properties: { expression: "", iterator: "i", size },
  segment: {},
  error: null,
});

const ifOp = (id: string, indexPath: string): FlowchartChildLog => ({
  ...base,
  id,
  indexPath,
  type: "IF",
  properties: { expression: "" },
  segment: { result: "true" },
  error: null,
});

const connector = (id: string): FlowchartLog => ({
  ...base,
  id,
  indexPath: "",
  type: "FLOWCHART",
  connectorName: "DEFAULT",
  properties: { CONNECTOR_ID: "1", DIRECTION: "source" },
  segment: {},
});

const fetcherFrom = (children: Record<string, FlowchartChildLog[]>) => {
  const calls: string[] = [];
  const fetch: FetchElementChildren = async (id, loopIndex) => {
    const key = loopIndex === undefined ? id : `${id}@${loopIndex}`;
    calls.push(key);
    return children[key] ?? [];
  };
  return { fetch, calls };
};

describe("findStoredErrorLocation", () => {
  it("finds a top-level failing method", async () => {
    const { fetch } = fetcherFrom({ c: [op("a", "0"), op("b", "1", "boom")] });
    expect(await findStoredErrorLocation([connector("c")], fetch)).toEqual({
      location: { indexPath: "1", loopIndex: "" },
      element: { id: "b", type: "OPERATION" },
    });
  });

  it("finds the failing iteration of a loop that stopped early", async () => {
    const { fetch } = fetcherFrom({
      c: [op("a", "0"), loop("l", "1", 40)],
      "l@0": [op("x0", "1_0")],
      "l@1": [op("x1", "1_0")],
      "l@2": [op("x2", "1_0", "boom")],
    });
    expect(await findStoredErrorLocation([connector("c")], fetch)).toEqual({
      location: { indexPath: "1_0", loopIndex: "2" },
      element: { id: "x2", type: "OPERATION" },
    });
  });

  it("follows nested loops and IFs", async () => {
    const { fetch } = fetcherFrom({
      c: [loop("outer", "0", 3)],
      "outer@0": [ifOp("if0", "0_0")],
      "outer@1": [ifOp("if1", "0_0")],
      "if1@0": [loop("inner", "0_0_0", 5)],
      "inner@0": [op("m", "0_0_0_0", "boom")],
    });
    expect(await findStoredErrorLocation([connector("c")], fetch)).toEqual({
      location: { indexPath: "0_0_0_0", loopIndex: "1,0" },
      element: { id: "m", type: "OPERATION" },
    });
  });

  it("reports an error on the operator itself", async () => {
    const failingLoop = {
      ...loop("l", "0", 0),
      error: { message: "bad expression", stack_trace: [] },
    };
    const { fetch } = fetcherFrom({ c: [failingLoop] });
    expect(
      (await findStoredErrorLocation([connector("c")], fetch))?.location,
    ).toEqual({
      indexPath: "0",
      loopIndex: "",
    });
  });

  it("skips connectors that never ran", async () => {
    const { fetch } = fetcherFrom({ source: [op("a", "0", "boom")] });
    expect(
      (
        await findStoredErrorLocation(
          [connector("source"), connector("target")],
          fetch,
        )
      )?.element.id,
    ).toBe("a");
  });

  it("lands on the last executed method when no element stored an error", async () => {
    const { fetch } = fetcherFrom({ c: [op("a", "0"), op("b", "1")] });
    expect(
      (await findStoredErrorLocation([connector("c")], fetch))?.element.id,
    ).toBe("b");
  });

  it("lands on a loop that failed before its first iteration", async () => {
    const { fetch } = fetcherFrom({ c: [op("a", "0"), loop("l", "1", -1)] });
    expect(await findStoredErrorLocation([connector("c")], fetch)).toEqual({
      location: { indexPath: "1", loopIndex: "" },
      element: { id: "l", type: "LOOP" },
    });
  });
});
