import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {INotification} from "@interface/schedule/INotification";
import {INotificationRequest} from "../../interfaces/schedule/INotification";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";
import {IUser} from "@interface/user/IUser";


export class NotificationRequest extends Request implements INotificationRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'scheduler', ...settings});
    }

    async checkNotificationName(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getNotificationById(): Promise<AxiosResponse<INotification>>{
        return super.get<INotification>();
    }

    async getNotificationByScheduleIdAndId(): Promise<AxiosResponse<INotification>>{
        return super.get<INotification>();
    }

    async getAllNotificationsByScheduleId(): Promise<AxiosResponse<INotification[]>>{
        return super.get<INotification[]>();
    }

    async getNotificationRecipients(): Promise<AxiosResponse<IUser[]>>{
        this.url = 'user/all';
        return super.get<IUser[]>();
    }

    async addNotification(notification: INotification): Promise<AxiosResponse<INotification>>{
        return super.post<INotification>(this.backendMap(notification));
    }

    async updateNotification(notification: INotification): Promise<AxiosResponse<INotification>>{
        return super.put<INotification>(this.backendMap(notification));
    }

    async deleteNotificationById(): Promise<AxiosResponse<INotification>>{
        return super.delete<INotification>();
    }

    backendMap(notification: INotification){
        let mappedNotification = {
            name: notification.name,
            eventType: notification.eventType,
            notificationType: notification.typeSelect.value,
            template: {templateId: notification.templateSelect.value, name: notification.templateSelect.label},
            recipients: notification.recipientsSelect.map(recipient => recipient.value),
            schedulerId: notification.scheduleId,
        };
        if(notification.id !== 0){
            return {
                notificationId: notification.id,
                ...mappedNotification,
            }
        }
        return mappedNotification;
    }
}