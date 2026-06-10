import type { Language, MainResponse } from './connection';

export type WorkflowBodyFormat = 'json' | 'xml' | 'x-www-form-urlencoded';

export type WorkflowEndpointArg = {
  id: string;
  source?: string;
  enhancement?: {
    enhanceId: string;
    description?: string;
    language: Language;
    script: string;
    args: Record<string, string>;
  };
};

export type WorkflowQueryParam = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export type WorkflowMethodConfig = {
  // The connector operation name — stable identity, kept distinct from the
  // user-editable label (the node subtitle) so saving a label doesn't overwrite it.
  name?: string;
  url: string;
  method?: string;
  headers: Record<string, string>;
  queryParams: WorkflowQueryParam[];
  endpointArgs: Record<string, WorkflowEndpointArg>;
  bodyFormat: WorkflowBodyFormat;
  body: unknown;
  response?: MainResponse;
};

export type WorkflowMethodEditorState = {
  nodeId: string;
  mode: 'url' | 'body' | 'header';
};

export type WorkflowConditionEditorState = {
  nodeId: string;
};
