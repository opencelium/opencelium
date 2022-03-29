import {AxiosResponse} from "axios";
import {IWidget} from "@interface/dashboard/IWidget";


export interface IWidgetRequest{

    //to get all widgets of authorized user
    getAllWidgets(): Promise<AxiosResponse<IWidget[]>>,
}