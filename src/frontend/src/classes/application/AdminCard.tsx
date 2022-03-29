import {IAdminCard} from "@interface/application/IAdminCard";

export class AdminCard implements IAdminCard{
    id: number;
    name: string = '';
    link: string = '';
    permission?: string = '';

    constructor(adminCard?: IAdminCard) {
        this.id = adminCard?.id || 0;
        this.name = adminCard?.name || '';
        this.link = adminCard?.link || '';
        this.permission = adminCard?.permission || '';
    }
}