import {AxiosResponse} from "axios";
import { INotificationTemplate } from "@interface/schedule/INotificationTemplate";
import {IResponse} from "../application/IResponse";

export interface INotificationTemplateRequest{

    /*
    * TODO: do not exist such method on the server
    */
    //to check if notification template with such name already exists
    checkNotificationTemplateName(): Promise<AxiosResponse<IResponse>>,

    //to get notification template by id
    getNotificationTemplateById(): Promise<AxiosResponse<INotificationTemplate>>,

    //to get all notification template by type
    getAllNotificationTemplatesByType(): Promise<AxiosResponse<INotificationTemplate[]>>,

    //to get all notification templates by authorized user
    getAllNotificationTemplates(): Promise<AxiosResponse<INotificationTemplate[]>>,

    //to add notification template
    addNotificationTemplate(notificationTemplate: INotificationTemplate): Promise<AxiosResponse<INotificationTemplate>>,

    //to update notification template
    updateNotificationTemplate(notificationTemplate: INotificationTemplate): Promise<AxiosResponse<INotificationTemplate>>,

    //to delete notification template by id
    deleteNotificationTemplateById(): Promise<AxiosResponse<INotificationTemplate>>,

    //to delete notification templates by id
    deleteNotificationTemplatesById(notificationTemplate: number[]): Promise<AxiosResponse<number[]>>,
}