import React, {FC} from 'react';
import MenuLink from "@molecule/menu/MenuLink";
import {useNavigate} from "react-router";
import {useDispatch} from "react-redux";
import { logout } from '@slice/application/AuthSlice';

const LogoutMenuItem: FC =
    ({

    }) => {
        const dispatch = useDispatch()
        let navigate = useNavigate();
        return (
            <MenuLink
                key={'log_out'}
                to={'#'}
                onClick={() => {
                    dispatch(logout());
                    navigate("/login", { replace: true });
                }}
                name={'logout'}
                label={'Log Out'}
                size={24}
                hasConfirmation={true}
                confirmationText={'Do you want to logout?'}
            />
        )
    }

LogoutMenuItem.defaultProps = {
}


export {
    LogoutMenuItem,
};
