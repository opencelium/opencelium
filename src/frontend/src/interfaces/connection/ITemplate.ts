import {IForm} from "@interface/application/core";
import {TemplateState} from "@slice/connection/TemplateSlice";
import {IConnection} from "@interface/connection/IConnection";


export interface ITemplateText{
    name: string;
    description?: string;
}


export interface ITemplateForm extends ITemplateText, IForm<ITemplateText, {}, {}, {}, {}, {}>{
    reduxState?: TemplateState;
    deleteById: () => boolean;
}

export interface ITemplate extends ITemplateForm{
    id?: string;
    dispatch?(instance: any): void;
    templateId?: string;
    link?: string;
    version?: string;
    connection?: IConnection;
    templateContent?: any;
}
