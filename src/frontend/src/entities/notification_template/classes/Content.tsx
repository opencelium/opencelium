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

import React, {ChangeEvent, ReactElement, ReactNode} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {RootState} from "@application/utils/store";
import {IInput} from "@application/interfaces/core";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {IContent, IContentText, IContentTextarea} from "../interfaces/INotificationTemplate";
import {NotificationTemplateState} from "../redux_toolkit/slices/NotificationTemplateSlice";
import AceEditor from "react-ace";
import Input from "@app_component/base/input/Input";

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

    getTexts(data: IInput<IContentText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<IContentText, InputTextProps>(data);
    }

    getTextarea(data: IInput<IContentTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IContentTextarea, InputTextareaProps>(data);
    }

    getBoby(props?: Partial<any>): ReactElement {
        const styleProps = {
            marginTop: '25px',
            display: 'inline-block',
            width: 'calc(100% - 50px)',
            marginLeft: '46px',
            marginBottom: 0,
            height: 'calc(100% - 37px)',
            borderBottom: '1px solid #e9e9e9'
        }
        // @ts-ignore
        const validationMessage = this.validations.body || '';
        return (
            <Input errorBottom={'-7px'} error={validationMessage} required={true} height={`calc(100% - 67px)`} value={'body'} label={'Body'} icon={'feed'} marginBottom={'20px'}>
                <AceEditor
                    {...props}
                    style={{...styleProps}}
                    mode={'text'}
                    theme="textmate"
                    name="notificationTemplateContent"
                    fontSize={16}
                    showPrintMargin={false}
                    showGutter={false}
                    highlightActiveLine={false}
                    setOptions={{
                        enableBasicAutocompletion: false,
                        enableLiveAutocompletion: false,
                        enableSnippets: false,
                        showLineNumbers: false,
                        tabSize: 1,
                        useWorker: false,
                        showPrintMargin: false,
                        showGutter: false,
                        displayIndentGuides: false,
                        highlightActiveLine: false,
                        highlightSelectedWord: false,
                        highlightGutterLine: false,
                        fixedWidthGutter: true,
                    }}
                    value={this.body}
                    // @ts-ignore
                    onChange={(newValue) => this.updateBody(this, newValue)}
                />
            </Input>
        )
    }
}
