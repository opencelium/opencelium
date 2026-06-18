import type { WorkflowCreateKind } from '../types/workflow.types';

export const OFFSETS = {
  right: { x: 165, y: 0 },
  bottom: { x: 0, y: 128 },
} as const;

export const TITLES: Record<WorkflowCreateKind, string> = {
  connector: 'Connector',
  system: 'HTTP Request',
  if: 'If',
  loop: 'Loop',
};

export const SUBTITLES: Partial<Record<WorkflowCreateKind, string>> = {
  system: 'GET',
};

export const COLLISION_LIMITS = {
  x: 100,
  y: 80,
};

export const FREE_POSITION_STEP = {
  right: { x: 0, y: 83 },
  bottom: { x: 165, y: 0 },
} as const;
