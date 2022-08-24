/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {ReactElement, ReactNode} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputSelectProps} from "@app_component/base/input/select/interfaces";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import {InputFileProps} from "@app_component/base/input/file/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {InputSwitchProps} from "@app_component/base/input/switch/interfaces";
import IUserDetail, {
    IUserDetailFile, IUserDetailRadios, IUserDetailSelect,
    IUserDetailSwitch, IUserDetailText, IUserDetailTextarea,
} from "../interfaces/IUserDetail";
import {UserState} from "../redux-toolkit/slices/UserSlice";
import {UserTitle} from "../requests/models/UserDetail";


export default class UserDetail extends HookStateClass implements IUserDetail{
    @App.inputType
    userTitle: UserTitle = UserTitle.NOT_SET;

    static reduxState?: UserState;

    @App.inputType
    name: string = '';

    @App.inputType
    surname: string = '';

    @App.inputType
    phoneNumber: string = '';

    @App.inputType
    department: string = '';

    @App.inputType
    organization: string = '';

    @App.inputType
    profilePictureFile: FileList;

    @App.inputType
    theme: string;

    @App.inputType
    appTour: boolean;

    profilePicture?: string = '';
    shouldDeletePicture?: boolean = false;

    constructor(userDetail?: Partial<IUserDetail> | null) {
        // @ts-ignore
        super(userDetail?.validations || {}, userDetail?._readOnly);
        this.userTitle = userDetail?.userTitle || UserTitle.NOT_SET;
        this.name = userDetail?.name || '';
        this.surname = userDetail?.surname || '';
        this.phoneNumber = userDetail?.phoneNumber || '';
        this.department = userDetail?.department || '';
        this.organization = userDetail?.organization || '';
        this.profilePictureFile = userDetail?.profilePictureFile || null;
        this.theme = userDetail?.theme || 'default';
        this.appTour = userDetail?.appTour || false;
        this.profilePicture = userDetail?.profilePicture || '';
        this.shouldDeletePicture = userDetail?.shouldDeletePicture || false;
    }

    static createState<T>(args?: Partial<IUserDetail>, observation?: any):T{
        return super.createState<IUserDetail>(UserDetail, (state: RootState) => state.userReducer, args,[{functionName: 'updateState', value: observation}]);
    }

    getText(data: IInput<IUserDetailText, InputTextProps>):ReactElement{
        return super.getInputText<IUserDetailText, InputTextProps>(data);
    }

    getTexts(data: IInput<IUserDetailText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<IUserDetailText, InputTextProps>(data);
    }

    getSelect(data: IInput<IUserDetailSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<IUserDetailSelect, InputSelectProps>(data);
    }

    getRadios(data: IInput<IUserDetailRadios, InputRadiosProps>): ReactElement {
        return super.getInputRadios<IUserDetailRadios, InputRadiosProps>(data);
    }

    getFile(data: IInput<IUserDetailFile, InputFileProps>): ReactElement {
        data.props.onToggleHasImage = (hasImage: boolean) => {
            this.shouldDeletePicture = hasImage;
            // @ts-ignore
            this.updateProfilePictureFile(this, this.profilePictureFile);
        }
        data.props.hasNoImage = this.shouldDeletePicture;
        data.props.hasCheckbox = false;
        return super.getInputFile<IUserDetailFile, InputFileProps>(data);
    }

    getTextarea(data: IInput<IUserDetailTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IUserDetailTextarea, InputTextareaProps>(data);
    }

    getSwitch(data: IInput<IUserDetailSwitch, InputSwitchProps>): ReactElement {
        return super.getInputSwitch<IUserDetailSwitch, InputSwitchProps>(data);
    }
}