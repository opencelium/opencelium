import type { WorkflowOperatorKind } from '../../types/workflow.types';

export const sidebarItems = [
  {
    key: 'connector',
    title: 'Use Connector',
    text: 'Browse through the list of available api calls of your connector.',
  },
  {
    key: 'operator',
    title: 'Add Operator',
    text: 'Add an IF or LOOP operator.',
  },
  {
    key: 'system',
    title: 'Add HTTP Request',
    text: 'Add a simple http request and add your url.',
  },
] as const;

export const operatorItems: {
  key: WorkflowOperatorKind;
  title: string;
  text: string;
}[] = [
  { key: 'if', title: 'If', text: 'Branch the workflow into true and false paths.' },
  { key: 'loop', title: 'Loop', text: 'Repeat the workflow step sequence.' },
];
