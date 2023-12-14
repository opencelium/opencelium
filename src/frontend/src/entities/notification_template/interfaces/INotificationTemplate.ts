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

import {IForm} from "@application/interfaces/core";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import {NotificationTemplateState} from "../redux_toolkit/slices/NotificationTemplateSlice";
import {Content} from "../classes/Content";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";

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
    add: (aggregators: ModelDataAggregator[]) => boolean;
    update: (aggregators: ModelDataAggregator[]) => boolean;
    deleteById: () => boolean;
    reduxState?: NotificationTemplateState;
}

export interface INotificationTemplate extends INotificationTemplateForm{
    id?: number;
    aggregators: ModelDataAggregator[];
    templateId?: number;
    type: string;
    content: Partial<Content>;
}

export type NotificationTemplateProps = keyof INotificationTemplate;
