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

import {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {RootState} from "@application/utils/store";
import {IInput} from "@application/interfaces/core";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {IContent, IContentText, IContentTextarea} from "../interfaces/INotificationTemplate";
import {NotificationTemplateState} from "../redux_toolkit/slices/NotificationTemplateSlice";

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