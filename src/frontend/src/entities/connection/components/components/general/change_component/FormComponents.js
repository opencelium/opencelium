/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { memo, useMemo } from 'react';
import FormSection from "@change_component/FormSection";
import styles from "@entity/connection/components/themes/default/general/form_component";
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import {TextSize} from "@app_component/base/text/interfaces";

export const ActionButton = memo((props) => {
    const {translations, type, doAction, isActionInProcess} = props;

    const icon = useMemo(() => {
        switch(type){
            case 'add':
                return 'add';
            case 'update':
                return 'autorenew';
            case 'onlyText':
            default:
                return '';
        }
    }, [type]);

    return (
        <Button
            isLoading={isActionInProcess}
            iconClassName={''}
            title={translations.action_button.title}
            icon={icon}
            disabled={isActionInProcess || translations.action_button.isDisabled}
            onClick={doAction}
            size={TextSize.Size_16}
        />
    );
});

export const SubFormSections = memo((props) => {
    const {key1, form, entity, updateEntity, clearValidationMessage, shouldScroll} = props;

    return(
        <div className={styles.subform}>
            {form.map((subform, key2) => (
                <FormSection
                    id={subform?.id}
                    shouldScroll={shouldScroll}
                    key={`${key1}_${key2}`}
                    isSubFormSection={true}
                    content={subform}
                    entity={entity}
                    updateEntity={updateEntity}
                    clearValidationMessage={clearValidationMessage}
                />
            ))}
        </div>
    );
});