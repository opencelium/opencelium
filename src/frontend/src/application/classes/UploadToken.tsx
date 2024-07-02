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
import {HookStateClass} from "../classes/HookStateClass";
import {Application as App} from "./Application";
import {IAuth} from "../interfaces/IAuth";
import {IInput} from "../interfaces/core";
import {RootState} from "../utils/store";
import {AuthState} from "../redux_toolkit/slices/AuthSlice";
import {uploadToken} from "../redux_toolkit/action_creators/AuthCreators";
import {
    IUploadToken,
    IUploadTokenFile,
    IUploadTokenRadios,
    IUploadTokenTextarea,
    UploadType
} from "@application/interfaces/IUploadToken";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {InputFileProps} from "@app_component/base/input/file/interfaces";

// class for upload token form
export class UploadToken extends HookStateClass implements IUploadToken {

    @App.inputType
    type: UploadType = UploadType.String;

    @App.inputType
    token: string = '';

    @App.inputType
    tokenFile: FileList;

    static reduxState?: AuthState;

    constructor(uploadTokenData?: { type: UploadType, token: string, tokenFile: FileList } | null) {
        // @ts-ignore
        super(uploadTokenData?.validations || {});
        this.type = uploadTokenData?.type || UploadType.String;
        this.token = uploadTokenData?.token || '';
        this.tokenFile = uploadTokenData?.tokenFile || null;
    }

    static createState<T>(args?: Partial<IAuth>):T{
        return super.createState<IAuth>(UploadToken, (state: RootState) => state.authReducer, args);
    }

    getRadios(data: IInput<IUploadTokenRadios, InputRadiosProps>): ReactElement {
        return super.getInputRadios<IUploadTokenRadios, InputRadiosProps>(data);
    }

    getTextarea(data: IInput<IUploadTokenTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IUploadTokenTextarea, InputTextareaProps>(data);
    }

    getFile(data: IInput<IUploadTokenFile, InputFileProps>): ReactElement {
        data.props.hasCheckbox = false;
        return super.getInputFile<IUploadTokenFile, InputFileProps>(data);
    }

    @App.dispatch(uploadToken, {mapping: (data: IUploadToken) => {return {token: data.token};}})
    upload(): boolean{
        return true;
    }
}
