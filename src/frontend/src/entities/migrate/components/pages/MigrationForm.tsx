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

import React, {FC} from "react";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IForm} from "@application/interfaces/IForm";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import CMigrationForm from '../../classes/MigrationForm';
import IMigrationForm from "@entity/migrate/interfaces/IMigrationForm";
import Button from "@app_component/base/button/Button";
import {InputTextType} from "@app_component/base/input/text/interfaces";


const MigrationForm: FC<IForm> = ({}) => {
    const {
        migrating, error,
    } = CMigrationForm.getReduxState();
    const migrationForm = CMigrationForm.createState<IMigrationForm>({}, null);
    const TextInputs = migrationForm.getTexts([
        {propertyName: "url", props: {icon: 'link', label: "Url", placeholder: 'bolt://localhost:7687'}},
        {propertyName: "username", props: {icon: 'person', label: "Username", placeholder: 'neo4j'}},
        {propertyName: "password", props: { icon: 'vpn_key', label: "Password", type: InputTextType.Password, placeholder: 'secretsecret' }},
    ])
    const actions = [<Button
        key={'action_button'}
        label={'Migrate'}
        icon={'swap_horiz'}
        handleClick={() => migrationForm.migrate()}
        isLoading={migrating === API_REQUEST_STATE.START}
    />]
    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Migration from Neo4j to MongoDB'}],
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                {TextInputs}
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data}/>
    )
}

export default MigrationForm
