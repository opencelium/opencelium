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

import {
    ConnectorPanelType
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/interfaces";

export interface IProcessLabel {
    startEditLabel: (animationSpeed: number) => {},
    endEditLabel: (animationSpeed: number) => {},
}

export interface IProcessUrl {
    openUrlDialog: (animationSpeed: number) => {},
    changeUrlMethod: (animationSpeed: number, animationData: any, connectorType: ConnectorPanelType) => {},
    changeUrlParam: (animationSpeed: number, animationData: any) => {},
    addUrlParam: (animationSpeed: number, animationData: any, connectorType: ConnectorPanelType) => {},
    closeUrlDialog: (animationSpeed: number) => {},
}

export interface IProcessHeader {
    openHeaderDialog: (animationSpeed: number) => {},
    closeHeaderDialog: (animationSpeed: number) => {},
}

export interface IProcessBodyKeyNotExist {
    displayBodyAddKeysButton: (animationSpeed: number) => {},
    showPopoverForBodyAddKeysButton: (animationSpeed: number) => {},
    clickAddKeysButton: (animationSpeed: number) => {},
    addBodyKeyName: (animationSpeed: number, ...args: any) => {},
    displaySubmitButtonToAddKey: (animationSpeed: number) => {},
    clickSubmitButtonToAddKey: (animationSpeed: number) => {},
}

export interface IProcessBodyDeleteKey {
    displayRemoveKeyButton: (animationSpeed: number, ...args: any) => {},
    showPopoverForBodyRemoveKeysButton: (animationSpeed: number) => {},
    clickRemoveKeyButton: (animationSpeed: number, ...args: any) => {},
}

export interface IProcessBodyActValueButton {
    displayEditKeyValueButton: (animationSpeed: number, ...args: any) => {},
    clickEditKeyValueButton: (animationSpeed: number, ...args: any) => {},
}

export interface IProcessBodyAddValue {
    showPopoverForAddBodyKeyValue: (...args: any) => {},
    addBodyKeyValue: (animationSpeed: number, ...args: any) => {},
}

export interface IProcessBodySetReference {
    changeBodyMethod: (animationSpeed: number, ...args: any) => {},
    changeBodyParam: (animationSpeed: number, ...args: any) => {},
    addBodyMethodAndParam: (animationSpeed: number, ...args: any) => {},
}

export default interface IDetailsForProcess extends IProcessLabel,
    IProcessUrl, IProcessHeader, IProcessBodyKeyNotExist, IProcessBodyDeleteKey,
    IProcessBodyActValueButton, IProcessBodyAddValue, IProcessBodySetReference {
    showPopoverForOpenBodyDialog: (animationSpeed: number) => {},
    openBodyDialog: (animationSpeed: number) => {},
    openBodyObject: (animationSpeed: number) => {},
    clickOnReferenceElements: (animationSpeed: number, ...args: any) => {},
    changeReferenceDescription: (animationSpeed: number, ...args: any) => {},
    changeReferenceContent: (animationSpeed: number, ...args: any) => {},
    clickSubmitButtonToAddValue: (animationSpeed: number, ...args: any) => {},
    closeBodyDialog: (animationSpeed: number, ...args: any) => {},
    showResponse: (animationSpeed: number, ...args: any) => {},
    deleteProcess: (animationSpeed: number, ...args: any) => {},
    showResult: (animationSpeed: number, ...args: any) => {},
}

export type IProcessLabelProps = keyof IProcessLabel;
export type IProcessUrlProps = keyof IProcessUrl;
export type IProcessHeaderProps = keyof IProcessHeader;
export type IProcessBodyKeyNotExistProps = keyof IProcessBodyKeyNotExist;
export type IProcessBodyDeleteKeyProps = keyof IProcessBodyDeleteKey;
export type IProcessBodyAddValueProps = keyof IProcessBodyAddValue;
export type IProcessBodySetReferenceProps = keyof IProcessBodySetReference;
export type IProcessBodyActValueButtonProps = keyof IProcessBodyActValueButton;
export type IDetailsForProcessMethodProps = keyof IDetailsForProcess;
