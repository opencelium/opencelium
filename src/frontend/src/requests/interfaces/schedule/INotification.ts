import {AxiosResponse} from "axios";
import { INotification } from "@interface/schedule/INotification";
import {IResponse} from "../application/IResponse";
import {IUser} from "@interface/user/IUser";

export interface INotificationRequest{

    /*
    * TODO: do not exist such method on the server
    */
    //to check if notification with such name already exists
    checkNotificationName(): Promise<AxiosResponse<IResponse>>,

    //to get notification by id
    getNotificationById(): Promise<AxiosResponse<INotification>>,

    //to get notification by id and schedule id
    getNotificationByScheduleIdAndId(): Promise<AxiosResponse<INotification>>,

    //to get all notifications by schedule id
    getAllNotificationsByScheduleId(): Promise<AxiosResponse<INotification[]>>,

    //to get recipients of notification
    getNotificationRecipients(): Promise<AxiosResponse<IUser[]>>,

    //to add notification
    addNotification(notificationTemplate: INotification): Promise<AxiosResponse<INotification>>,

    //to update notification
    updateNotification(notificationTemplate: INotification): Promise<AxiosResponse<INotification>>,

    //to delete notification by id
    deleteNotificationById(): Promise<AxiosResponse<INotification>>,
}