import React, {FC} from 'react';
import FormComponent from "../../organisms/form/Form";
import FormSection from "@organism/form_section/FormSection";
import Button from "@atom/button/Button";
import FileNames from "@organism/file_names/FileNames";
import {Application} from "@class/application/Application";

const SubscriptionUpdateForm: FC =
    ({

    }) => {
    const {resources} = Application.getReduxState();
    const fileNames = resources?.files_name || [];
    const data = {
        title: 'Update Invokers and Templates',
        actions: [<Button
            key={'list_button'}
            label={'Update'}
            icon={'refresh'}
            href={'/'}
            isDisabled={fileNames.length === 0}
        />],
        formSections: [
            <FormSection label={{value: 'subscription details'}}>
                <FileNames/>
            </FormSection>
        ]
    }
    return (
        <FormComponent {...data}/>
    )
}

SubscriptionUpdateForm.defaultProps = {
}


export {
    SubscriptionUpdateForm,
};
