import {IForm} from "@interface/application/core";
import {OptionProps} from "@atom/input/select/interfaces";
import {NotificationTemplateState} from "@slice/schedule/NotificationTemplateSlice";
import {Content} from "@class/schedule/Content";

export interface IContentTextarea{
    body: string;
}

export interface IContentText{
    subject: string,
}

export interface IContentForm extends IContentText, IContentTextarea, IForm<IContentText, {}, {}, {}, IContentTextarea, {}>{}

export interface IContent extends IContentForm{
    contentId?: number,
    language?: string,
}

export interface INotificationTemplateFile{
}

export interface INotificationTemplateTextarea{
}

export interface INotificationTemplateSelect{
    typeSelect: OptionProps;
}

export interface INotificationTemplateText{
    name: string;
}


export interface INotificationTemplateForm extends INotificationTemplateText, INotificationTemplateTextarea, INotificationTemplateSelect, INotificationTemplateFile, IForm<INotificationTemplateText, INotificationTemplateSelect, {}, INotificationTemplateFile, INotificationTemplateTextarea, {}>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
    reduxState?: NotificationTemplateState;
}

export interface INotificationTemplate extends INotificationTemplateForm{
    id?: number;
    templateId?: number;
    type: string;
    content: Partial<Content>;
}
