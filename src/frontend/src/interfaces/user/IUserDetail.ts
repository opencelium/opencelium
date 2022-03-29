import {IForm} from "@interface/application/core";
export enum UserTitle{
    MR= 'mr',
    MRS= 'mrs',
    NOT_SET= '',
}
export interface IUserDetailSwitch{
    appTour: boolean,
}

export interface IUserDetailFile{
    profilePictureFile: FileList;
}
export interface IUserDetailTextarea{
}

export interface IUserDetailSelect{
}

export interface IUserDetailRadios{
    userTitle: UserTitle;
    theme: string,
}

export interface IUserDetailText{
    name: string;
    surname: string;
    phoneNumber: string;
    department: string;
    organization: string;
}


export interface IUserDetailForm extends IUserDetailText, IUserDetailSelect, IUserDetailRadios, IUserDetailFile, IUserDetailSwitch, IForm<IUserDetailText, IUserDetailSelect, IUserDetailRadios, IUserDetailFile, IUserDetailTextarea, IUserDetailSwitch>{

}
export interface IUserDetail extends IUserDetailForm{
    profilePicture?: string,
    shouldDeletePicture?: boolean,
}
