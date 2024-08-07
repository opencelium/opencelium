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

import {ReactElement} from "react";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {InputFileProps} from "@app_component/base/input/file/interfaces";
import {
    activateLicenseFile,
    activateLicenseString
} from "@entity/application/redux_toolkit/action_creators/LicenseCreators";
import {HookStateClass} from "@application/classes/HookStateClass";
import {
    IActivateLicenseForm, IActivateLicenseFormFile,
    IActivateLicenseFormRadios,
    IActivateLicenseFormTextarea,
    UploadType
} from "@entity/application/interfaces/IActivateLicenseForm";
import {AuthState} from "@application/redux_toolkit/slices/AuthSlice";
import {IInput} from "@application/interfaces/core";
import {Application} from "@application/classes/Application";
import {RootState} from "@application/utils/store";

export class ActivateLicenseForm extends HookStateClass implements IActivateLicenseForm {

    @Application.inputType
    type: UploadType = UploadType.File;

    @Application.inputType
    token: string = '';

    @Application.inputType
    tokenFile: FileList;

    static reduxState?: AuthState;

    constructor(uploadTokenData?: { type: UploadType, token: string, tokenFile: FileList } | null) {
        // @ts-ignore
        super(uploadTokenData?.validations || {});
        this.type = uploadTokenData?.type || UploadType.String;
        this.token = uploadTokenData?.token || '';
        this.tokenFile = uploadTokenData?.tokenFile || null;
    }
    static createState<T>(args?: Partial<IActivateLicenseForm>):T{
        return super.createState<IActivateLicenseForm>(ActivateLicenseForm, (state: RootState) => state.licenseReducer, args);
    }
    getRadios(data: IInput<IActivateLicenseFormRadios, InputRadiosProps>): ReactElement {
        return super.getInputRadios<IActivateLicenseFormRadios, InputRadiosProps>(data);
    }

    getTextarea(data: IInput<IActivateLicenseFormTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IActivateLicenseFormTextarea, InputTextareaProps>(data);
    }

    getFile(data: IInput<IActivateLicenseFormFile, InputFileProps>): ReactElement {
        data.props.hasCheckbox = false;
        return super.getInputFile<IActivateLicenseFormFile, InputFileProps>(data);
    }

    @Application.dispatch(activateLicenseFile, {mapping: (data: IActivateLicenseForm) => {return {token: data.token};}})
    activateFile(): boolean{
        return true;
    }
    @Application.dispatch(activateLicenseString, {mapping: (data: IActivateLicenseForm) => {return {token: data.token};}})
    activateString(): boolean{
        return true;
    }
}
