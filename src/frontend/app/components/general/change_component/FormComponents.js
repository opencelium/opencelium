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
        case 'onlyText':
            break;
    }
    if(isActionInProcess){
        icon = 'loading';
        iconClassName = styles.action_button_loading;
    }
    return <Button
        iconClassName={iconClassName}
        title={translations.action_button.title}
        icon={icon}
        disabled={isActionInProcess || translations.action_button.isDisabled}
        onClick={doAction}
    />;
}

export const SubFormSections = (props) => {
    const {key1, form, entity, updateEntity, clearValidationMessage} = props;
    return(
        <div className={styles.subform}>
            {
                form.map((subform, key2) => {
                    return (
                        <FormSection
                            key={`${key1}_${key2}`}
                            isSubFormSection={true}
                            content={subform}
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