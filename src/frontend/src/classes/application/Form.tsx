import {FormDataButtonProps, FormDataProps, IForm} from "@interface/application/IForm";
import {capitalize} from "../../utils";

export class Form implements IForm{
    isView?: boolean;
    isUpdate?: boolean;
    isAdd?: boolean;

    constructor(form?: Partial<IForm>) {
        this.isView = form?.isView || false;
        this.isUpdate = form?.isUpdate || false;
        this.isAdd = form?.isAdd || false;
    }

    getFormData(entityName: string): FormDataProps{
        let formTitle = '';
        let actionButton: FormDataButtonProps = {icon: '', label: ''};
        let listButton: FormDataButtonProps = {icon: '', label: ''};
        if(this.isUpdate){
            formTitle = `Update ${capitalize(entityName)}`;
            actionButton.label = 'Update';
            actionButton.icon = 'update';
        }
        if(this.isAdd){
            formTitle = `Add ${capitalize(entityName)}`;
            actionButton.label = 'Add';
            actionButton.icon = 'add';
        }
        if(this.isView){
            formTitle = `View ${capitalize(entityName)}`;
            listButton.label = `${capitalize(entityName)}s`;
            listButton.icon = 'list_alt';
        } else{
            listButton.label = `Cancel`;
            listButton.icon = 'cancel';
        }
        return{
            formTitle,
            actionButton,
            listButton,
        }
    }

}