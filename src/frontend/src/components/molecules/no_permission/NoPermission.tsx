import React, {FC} from 'react';
import { NoPermissionStyled } from './styles';

const NoPermission: FC =
    ({

    }) => {
    return (
        <NoPermissionStyled >
            You have no permissions
        </NoPermissionStyled>
    )
}

NoPermission.defaultProps = {
}


export {
    NoPermission,
};