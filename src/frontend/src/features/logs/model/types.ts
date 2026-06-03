export type LogType =
  | "OPERATION"
  | "EXECUTION"
  | "FLOWCHART"
  | "LOOP"
  | "IF"
  | "UNKNOWN";
export type LogStatus = "PENDING" | "COMPLETE" | "FAIL";

// Whether a stored log file is from a successful ('s') or failed ('f') run.
export type LogFileStatus = "s" | "f";

export type LogError = {
  message: string;
  stack_trace: string[];
} | null;

export type LogIdentifier = {
  executionId: string;
  flowId: string;
  indexPath: string;
};

export type FlowchartProperty = {
  CONNECTOR_ID: string;
  DIRECTION: "source" | "target";
};

export type MethodProperty = { name: string };
export type LoopProperty = {
  expression: string;
  size: number;
  iterator: string;
};
export type IfProperty = { expression: string };

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type LightMethodSegment = {
  request: { url: string; http_method: HttpMethod };
  response: { status: string; duration: string };
};

export type DetailedMethodSegment = {
  request: {
    url: string;
    http_method: string;
    header: string;
    payload: string;
  };
  response: {
    status: string;
    duration: string;
    header: string;
    payload: string;
  };
};

export type LightIfSegment = { result: "true" | "false" };

// Top-level connector node returned by /execution/log/element/{executionId}/children.
export type FlowchartLog = LogIdentifier & {
  id: string;
  status: LogStatus;
  type: "FLOWCHART";
  connectorName: string;
  properties: FlowchartProperty;
  segment: Record<string, never>;
  error?: LogError;
  message?: string;
};

// A child of a connector or operator. Discriminated by `type`.
export type FlowchartChildLog = LogIdentifier &
  (
    | {
        id: string;
        status: LogStatus;
        type: "OPERATION";
        connectorName: string | null;
        properties: MethodProperty;
        segment: LightMethodSegment;
        error: LogError;
      }
    | {
        id: string;
        status: LogStatus;
        type: "LOOP";
        connectorName: string | null;
        properties: LoopProperty;
        segment: Record<string, never>;
        error: LogError;
      }
    | {
        id: string;
        status: LogStatus;
        type: "IF";
        connectorName: string | null;
        properties: IfProperty;
        segment: LightIfSegment;
        error: LogError;
      }
  );

// Full method detail returned by /execution/log/element/{id}/details.
export type DetailedMethodLog = LogIdentifier & {
  id: string;
  status: LogStatus;
  type: "OPERATION";
  connectorName: string;
  properties: MethodProperty;
  segment: DetailedMethodSegment;
  error: LogError;
};
