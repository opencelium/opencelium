/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC} from 'react';
import {Application} from "@application/classes/Application";
import Button from "@app_component/base/button/Button";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import {FileNames} from "./file_names/FileNames";

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
