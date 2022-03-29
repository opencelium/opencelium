import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {Toast as ReactstrapToast, ToastHeader, ToastBody} from 'reactstrap';
import { ToastProps } from './interfaces';
import { ToastStyled } from './styles';

const Toast: FC<ToastProps> =
    ({
         header,
         body,
         left,
         top
    }) => {
    return (
        <ToastStyled >
            <ReactstrapToast style={{position: "absolute", left, top, zIndex: 1000000}}>
                <ToastHeader>
                    {header}
                </ToastHeader>
                <ToastBody>
                    {body}
                </ToastBody>
            </ReactstrapToast>
        </ToastStyled>
    )
}

Toast.defaultProps = {
}


export {
    Toast,
};

export default withTheme(Toast);