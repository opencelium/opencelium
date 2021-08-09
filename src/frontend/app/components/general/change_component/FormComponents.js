import React from 'react';
import FormSection from "@change_component/FormSection";
import styles from "@themes/default/general/form_component";
import Button from "@basic_components/buttons/Button";

export const ActionButton = (props) => {
    const {translations, type, doAction, isActionInProcess} = props;
    let icon = '';
    let iconClassName = '';
    switch(type){
        case 'add':
            icon = 'add';
            break;
        case 'update':
            icon = 'autorenew';
            break;
    }
    if(isActionInProcess){
        icon = 'loading';
        iconClassName = styles.action_button_loading;
    }
    return <Button
        iconClassName={iconClassName}
        title={<span>{translations.action_button.title}</span>}
        icon={icon}
        disabled={isActionInProcess}
        onClick={doAction}
    />;
}

export const SubFormSections = (props) => {
    const {key1, form, contents, entity, updateEntity, clearValidationMessage} = props;
    return(
        <div className={styles.subform}>
            {
                form.map((subform, key2) => {
                    const inputs = contents[key1][key2].inputs;
                    return (
                        <FormSection
                            key={`${key1}_${key2}`}
                            isSubFormSection={true}
                            header={contents[key1][key2].header}
                            visible={contents[key1][key2].visible}
                            inputs={inputs}
                            entity={entity}
                            updateEntity={updateEntity}
                            clearValidationMessage={clearValidationMessage}
                        />
                    );
                })
            }
        </div>
    );
}