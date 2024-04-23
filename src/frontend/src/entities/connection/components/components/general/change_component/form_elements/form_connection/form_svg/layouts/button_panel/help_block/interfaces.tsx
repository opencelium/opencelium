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
import {
  DetailsForOperatorsMethodProps
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/interfaces/IDetailsForOperators";
import {
  IProcessBodyActValueButton, IProcessBodyActValueButtonProps,
  IProcessBodyAddValueProps,
  IProcessBodyDeleteKeyProps,
  IProcessBodyKeyNotExistProps, IProcessBodySetReferenceProps,
  IProcessHeaderProps,
  IProcessLabelProps, IProcessUrlProps
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/interfaces/IDetailsForProcess";

interface IfOperatorFunctions {
  LeftExpression: DetailsForOperatorsMethodProps[],
  RelationalOperator: DetailsForOperatorsMethodProps,
  RightExpression: {
    PropertyExpression: DetailsForOperatorsMethodProps[],
    RestExpression: DetailsForOperatorsMethodProps[],
  }
}
interface LoopOperatorFunctions {
  LeftExpression: DetailsForOperatorsMethodProps[],
  RelationalOperator: DetailsForOperatorsMethodProps,
  RightExpression: DetailsForOperatorsMethodProps[],
}

interface MethodFunctions {
  Label: IProcessLabelProps[],
  Url: IProcessUrlProps[],
  Header: IProcessHeaderProps[],
  Body: {
    KeyNotExist: IProcessBodyKeyNotExistProps[],
    DeleteKey: IProcessBodyDeleteKeyProps[],
    AddValue: (IProcessBodyAddValueProps | IProcessBodyActValueButtonProps)[],
    SetReference: IProcessBodySetReferenceProps[],
  }
}

interface HelpBlockProps {
  theme?: ITheme;
}

interface HelpBlockStyledProps {
  theme?: ITheme;
  readonly isButtonPanelOpened: boolean;
}

type ConnectorPanelType = "fromConnector" | "toConnector";


type RelationalOperatorForIf = "IsNull" | "AllowList" | "DenyList" | "IsTypeOf" | "PropertyExists" | "PropertyNotExists" | "Contains" | "NotContains" | "ContainsSubStr" | "NotContainsSubStr" | "RegExp" | "Like" | "NotLike" | ">=" | ">" | "<=" | "<" | "=" | "!=" | "NotNull" | "IsEmpty" | "NotEmpty";

type RelationalOperatorForLoop = "SplitString" | "forin";

interface IBaseAnimationData {
  index: string;
  type: "process" | "operator";
  name: string;
  delete?: boolean;
  toDown?: true | false;
  after?: string;
  afterElementType?: "process" | "operator";
  scripts?: IScriptsData[];
  label?: string;
  changeLabel?: string;
}

interface IScriptsData {
  functionId: string;
  text: string;
}

interface IAnimationDataForProcess extends IBaseAnimationData {
  endpoint?: IEndpointData;
  body?: IBodyData[];
  header?: boolean;
  response?: boolean;
}

interface IAnimationDataForIf extends IBaseAnimationData {
  conditionForIf?: IConditionDataForIf;
}

interface IAnimationDataForLoop extends IBaseAnimationData {
  conditionForLoop?: IConditionDataForLoop;
}

interface IEndpointData {
  index?: string;
  param?: string;
  connectorType?: ConnectorPanelType;
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
  relationalOperator?: RelationalOperatorForLoop;
  rightStatement?: {
    fromConnector: ConnectorPanelType,
    rightMethodIndex: string,
    rightParam: string
  }
}

interface IBodyData{
  keyName?: string;
  keyValue?: string;
  available?: boolean;
  deleteKey?: boolean;
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
  fromConnector: {
    invoker: {
      name: string;
    },
    items: IConnectorData[]
  };
  toConnector: {
    invoker: {
      name: string;
    },
    items: IConnectorData[]
  };
  initialConnection?: any,
}

interface IAnimationData {
  [key: string]: IConnectorType;
}

export {
  HelpBlockProps, HelpBlockStyledProps, ConnectorPanelType,
  IAnimationData, IfOperatorFunctions, LoopOperatorFunctions,
  MethodFunctions,
};
