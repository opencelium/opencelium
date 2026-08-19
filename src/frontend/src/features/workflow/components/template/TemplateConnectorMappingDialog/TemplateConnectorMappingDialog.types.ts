import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import type { ConnectorMappingGroup } from '../templateConnectorMapping.utils';

export type TemplateConnectorMappingDialogProps = {
  open: boolean;
  groups: ConnectorMappingGroup[];
  connectors: Connector[];
  invokers: Invoker[];
  onConfirm: (mapping: Record<number, number>) => void;
  onCancel: () => void;
};
