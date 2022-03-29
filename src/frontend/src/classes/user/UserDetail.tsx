import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    IUserDetail,
    IUserDetailFile,
    IUserDetailRadios,
    IUserDetailSelect,
    IUserDetailSwitch,
    IUserDetailText,
    IUserDetailTextarea,
    UserTitle
} from "@interface/user/IUserDetail";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputSelectProps} from "@atom/input/select/interfaces";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {InputFileProps} from "@atom/input/file/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {UserState} from "@slice/UserSlice";
import {RootState} from "@store/store";
import {InputSwitchProps} from "@atom/input/switch/interfaces";


export class UserDetail extends HookStateClass implements IUserDetail{
    @App.inputType
    userTitle: UserTitle = UserTitle.NOT_SET;

    static reduxState?: UserState;

    @App.required
    @App.inputType
    name: string = '';

    @App.required
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
        this.theme = userDetail?.theme || '';
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

    getTexts(data: IInput<IUserDetailText, InputTextProps>[]):ReactNodeArray{
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