import {IExternalApplication} from "@interface/external_application/IExternalApplication";
import {useAppSelector} from "../../hooks/redux";
import {RootState} from "@store/store";
import {ExternalApplicationStatus} from "@requestInterface/external_application/IExternalApplication";

export class ExternalApplication implements IExternalApplication{
    id: number;
    name: string = '';
    link: string = '';
    icon: string = '';
    value: string = '';
    status?: ExternalApplicationStatus = ExternalApplicationStatus.DOWN;

    constructor(externalApplication?: Partial<IExternalApplication>) {
        this.id = externalApplication?.id || 0;
        this.name = externalApplication?.name || '';
        this.link = externalApplication?.link || '';
        this.icon = externalApplication?.icon || '';
        this.value = externalApplication?.value || '';
        this.status = externalApplication?.status || ExternalApplicationStatus.DOWN;
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.externalApplicationReducer);
    }
}