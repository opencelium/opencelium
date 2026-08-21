import type { WorkflowOperatorKind } from '../../types/workflow.types';

export const sidebarItems: {
  key: string;
  titleKey: string;
  textKey: string;
}[] = [
  {
    key: 'connector',
    titleKey: 'sidebar.useConnector.title',
    textKey: 'sidebar.useConnector.description',
  },
  {
    key: 'operator',
    titleKey: 'sidebar.addOperator.title',
    textKey: 'sidebar.addOperator.description',
  },
  {
    key: 'system',
    titleKey: 'sidebar.addHttpRequest.title',
    textKey: 'sidebar.addHttpRequest.description',
  },
  {
    key: 'joint',
    titleKey: 'sidebar.addJoint.title',
    textKey: 'sidebar.addJoint.description',
  },
  {
    key: 'trigger-connection',
    titleKey: 'sidebar.triggerConnection.title',
    textKey: 'sidebar.triggerConnection.description',
  },
];

export const operatorItems: {
  key: WorkflowOperatorKind;
  titleKey: string;
  textKey: string;
}[] = [
  { key: 'if', titleKey: 'sidebar.operatorOption.if.title', textKey: 'sidebar.operatorOption.if.description' },
  { key: 'loop', titleKey: 'sidebar.operatorOption.loop.title', textKey: 'sidebar.operatorOption.loop.description' },
];
