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

import React, {FC, useEffect, useState} from "react";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IForm} from "@application/interfaces/IForm";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import Button from "@app_component/base/button/Button";
import LdapCheckForm from "../../classes/LdapCheckForm";
import ILdapCheckForm from "@entity/ldap/interfaces/ILdapCheckForm";
import {useAppDispatch} from "@application/utils/store";
import {getDefaultConfig} from "@entity/ldap/redux_toolkit/action_creators/LdapCreators";
import {clearDebugLogs} from "@entity/ldap/redux_toolkit/slices/LdapSlice";
import Hint from "@app_component/base/hint/Hint";
import {Auth} from "@application/classes/Auth";


const LdapCheck: FC<IForm> = ({}) => {
    const dispatch = useAppDispatch();
    const {
        gettingDefaultConfig, testingConfig, defaultConfig,
        debugLogs, error,
    } = LdapCheckForm.getReduxState();
    useEffect(() => {
        dispatch(getDefaultConfig());
        return () => {
            dispatch(clearDebugLogs());
        }
    }, []);

    const ldapForm = LdapCheckForm.createState<ILdapCheckForm>({_readOnly: false}, defaultConfig);
    const TextInputs = ldapForm.getTexts([
        {propertyName: "urls", props: {icon: 'perm_identity', label: "Url", required: true}},
        {propertyName: "baseDN", props: {icon: 'perm_identity', label: "BaseDN", required: true}},
        {propertyName: "userDN", props: {icon: 'perm_identity', label: "UserDN", required: true}},
        {propertyName: "groupDN", props: {icon: 'perm_identity', label: "GroupDN"}},
        {propertyName: "username", props: {icon: 'perm_identity', label: "Read Account DN"}},
        {propertyName: "password", props: {icon: 'perm_identity', label: "Read Account Password"}},
        {propertyName: "userSearchFilter", props: {icon: 'perm_identity', label: "User Search Filter"}},
        {propertyName: "groupSearchFilter", props: {icon: 'perm_identity', label: "Group Search Filter"}},
    ])
    const actions = [<Button
        key={'test_button'}
        label={'Test Config'}
        icon={'play_arrow'}
        handleClick={() => {
            dispatch(clearDebugLogs());
            ldapForm.test();
        }}
        isLoading={testingConfig === API_REQUEST_STATE.START}
    />]
    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'LDAP check'}],
        actions,
        formSections: [
            <FormSection label={{value: 'Configurations'}}>
                {TextInputs}
                {!defaultConfig && <div style={{marginLeft: 10, marginTop: 20, marginBottom: 20}}><Hint message={'You can set configurations in application.yml file'}/></div>}
            </FormSection>,
            <FormSection dependencies={[debugLogs.length === 0]} label={{value: 'Debug'}}>
                <div style={{margin: '20px 0 0 20px'}}>{debugLogs}</div>
            </FormSection>
        ]
    }
    return(
        <FormComponent isLoading={gettingDefaultConfig === API_REQUEST_STATE.START} {...data}/>
    )
}

export default LdapCheck
