import { ConnectorPanelType } from "../interfaces";

export interface setSvgViewBoxProps {
  elementId: string;
  currentSvgElementId?: string;
  connectorType?: ConnectorPanelType;
  forResult?: boolean;
}