import React from 'react';
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {API_REQUEST_STATE, PermissionProps} from "@application/interfaces/IApplication";
import {useAppDispatch} from "@application/utils/store";
import {enableUsersTotp} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";
import Totp from "@entity/totp/classes/Totp";

const EnableTfaButton = ({checkedIds, permission}: {checkedIds: number[], permission: PermissionProps}) => {
    const dispatch = useAppDispatch();
    const {enablingUsersTotp} = Totp.getReduxState();
    return (
        <PermissionButton
            key={'enable_tfa_button'}
            isDisabled={checkedIds.length === 0}
            icon={'smartphone'}
            label={'Enable TFA'}
            permission={permission}
            isLoading={enablingUsersTotp === API_REQUEST_STATE.START}
            handleClick={() => {
                dispatch(enableUsersTotp(checkedIds));
            }}
        />
    )
}

export default EnableTfaButton;
