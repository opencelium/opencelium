/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { ITheme } from "@style/Theme";

interface HelpBlockProps {
  theme?: ITheme;
}

interface HelpBlockStyledProps {
  theme?: ITheme;
  readonly isButtonPanelOpened: boolean;
}

type ConnectorPanelType = "fromConnector" | "toConnector";


type RelationalOperatorForIf = "IsNull" | "AllowList" | "DenyList" | "IsTypeOf" | "PropertyExists" | "PropertyNotExists" | "Contains" | "NotContains" | "ContainsSubStr" | "NotContainsSubStr" | "RegExp" | "Like" | "NotLike" | ">=" | ">" | "<=" | "<" | "=" | "!=" | "NotNull" | "IsEmpty" | "NotEmpty";

type RelationalOperatorForLoop = "SplitString";

interface IBaseAnimationData {
  index: string;
  type: "process" | "operator";
  name: string;
  delete?: boolean;
  toDown?: true | false;
  after?: string;
  scripts?: IScriptsData[];
  label?: string;
}

interface IScriptsData {
  functionId: string;
  text: string;
}

interface IAnimationDataForProcess extends IBaseAnimationData {
  
  endpoint?: IEndpointData;
  body?: IBodyData[];
}

interface IAnimationDataForIf extends IBaseAnimationData {
  conditionForIf?: IConditionDataForIf;
}

interface IAnimationDataForLoop extends IBaseAnimationData {
  conditionForLoop?: IConditionDataForLoop;
}

interface IEndpointData {
  index: string;
  param: string;
  connectorType: ConnectorPanelType;
}

interface IConditionDataForIf {
  leftStatement: {
    fromConnector: ConnectorPanelType, 
    leftMethodIndex: string, 
    leftParam: string
  }
  relationalOperator: RelationalOperatorForIf;
  rightStatement?: {
    fromConnector?: ConnectorPanelType, 
    property?: string, 
    rightMethodIndex?: string, 
    rightParam?: string
  }
}

interface IConditionDataForLoop {
  leftStatement: {
    fromConnector: ConnectorPanelType, 
    leftMethodIndex: string, 
    leftParam: string
  }
  relationalOperator: RelationalOperatorForLoop;
  rightStatement: {
    fromConnector: ConnectorPanelType, 
    rightMethodIndex: string, 
    rightParam: string
  }
}

interface IBodyData{
  keyName: string;
  keyValue: string;
  available?: boolean;
  reference?: IBodyReferenceData[];
}

interface IBodyReferenceData{
  enhancementDescription?: string;
  enhancementContent?: string;
  method?: IBodyReferenceMethodData[];
}

interface IBodyReferenceMethodData{
  fromConnector: ConnectorPanelType;
  index: string;
  param: string;
}

type IConnectorData = IAnimationDataForProcess | IAnimationDataForIf | IAnimationDataForLoop;

interface IConnectorType {
  fromConnector: IConnectorData[];
  toConnector: IConnectorData[];
}

interface IAnimationData {
  [key: string]: IConnectorType;
}

export { HelpBlockProps, HelpBlockStyledProps, ConnectorPanelType, IAnimationData };
