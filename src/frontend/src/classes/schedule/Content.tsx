import {HookStateClass} from "../application/HookStateClass";
import {IContent, IContentText, IContentTextarea} from "@interface/schedule/INotificationTemplate";
import {Application as App} from "../application/Application";
import {RootState} from "@store/store";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {ReactElement, ReactNodeArray} from "react";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {NotificationTemplateState} from "@slice/schedule/NotificationTemplateSlice";

export class Content extends HookStateClass implements IContent{

    static reduxState?: NotificationTemplateState;

    contentId?: number = 0;

    language?: string = '';

    @App.inputType
    subject: string = '';

    @App.inputType
    body: string = '';

    constructor(content?: Partial<Content> | null) {
        // @ts-ignore
        super(content?.validations || {}, content?._readOnly);
        this.contentId = content?.contentId || 0;
        this.language = content?.language || '';
        this.subject = content?.subject || '';
        this.body = content?.body || '';
    }

    static createState<T>(args?: Partial<IContent>, observation?: any):T{
        return super.createState<IContent>(Content, (state: RootState) => state.scheduleNotificationTemplateReducer, args,[{functionName: 'updateState', value: observation}]);
    }

    getText(data: IInput<IContentText, InputTextProps>):ReactElement{
        return super.getInputText<IContentText, InputTextProps>(data);
    }

    getTexts(data: IInput<IContentText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<IContentText, InputTextProps>(data);
    }

    getTextarea(data: IInput<IContentTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IContentTextarea, InputTextareaProps>(data);
    }
}