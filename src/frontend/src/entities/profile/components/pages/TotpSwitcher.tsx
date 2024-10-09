import React, {useState} from 'react';
import InputSwitch from "@app_component/base/input/switch/InputSwitch";
import {useAppDispatch} from "@application/utils/store";
import {
    disableTotp,
    enableTotp,
} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {Auth} from "@application/classes/Auth";
import Totp from "@entity/totp/classes/Totp";

const TotpSwitcher = ({userId}: {userId: number}) => {
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const {togglingTotp} = Totp.getReduxState();
    const [isEnabled, toggleTotp] = useState<boolean>(authUser?.totpEnabled || false);
    const dispatchToggle = () => {
        if (isEnabled) {
            dispatch(disableTotp(userId));
        } else {
            dispatch(enableTotp(userId));
        }
    }
    return (
        <InputSwitch
            name={`${isEnabled ? 'Disable' : 'Enable'} Two Factor Authentication`}
            icon={'security'}
            label={'Security'}
            isChecked={isEnabled}
            isLoading={togglingTotp === API_REQUEST_STATE.START}
            onClick={dispatchToggle}
            hasConfirmation={isEnabled}
            title={`Two Factor Authentication is ${isEnabled ? 'activated' : 'deactivated'}`}
            confirmationText={'Do you really want to disable Two Factor Authentication?'}
        />
    )
}

export default TotpSwitcher;
