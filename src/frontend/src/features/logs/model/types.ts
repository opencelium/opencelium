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

// Error attached to a live socket line. `originOfErrorPath` is the indexPath
// of the element where the error actually happened — the carrying line may be
// a parent (or the EXECUTION end line), so display the message at the origin.
export type SocketLogError = {
  message: string;
  code: string | null;
  originOfErrorPath: string;
  stackTrace: string | null;
} | null;

// Live log line pushed over STOMP to /execution/logs/{channelId} while a
// connection test runs (LogDataDTO on the backend). Unlike the REST tree
// types above, properties/segment arrive as loose partial maps, and LOOP
// entries carry the comma-separated `loopIndex` of the current iteration.
export type SocketLogProperties = Partial<FlowchartProperty> &
  Partial<MethodProperty> &
  Partial<LoopProperty> &
  Partial<IfProperty> & {
    loopIndex?: string;
  };

// Method lines carry url/http_method from the start and fill in status,
// duration and (when logged) header/payload as the phase completes.
export type SocketLogSegment = {
  request?: Partial<DetailedMethodSegment["request"]>;
  response?: Partial<DetailedMethodSegment["response"]>;
  result?: LightIfSegment["result"];
};

export type ExecutionSocketLog = LogIdentifier & {
  id: string;
  status: LogStatus;
  type: LogType;
  connectorName: string | null;
  properties: SocketLogProperties | null;
  segment: SocketLogSegment | null;
  error: SocketLogError;
  message?: string;
};
