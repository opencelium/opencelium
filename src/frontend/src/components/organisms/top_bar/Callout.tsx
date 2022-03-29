import ReactDOM from "react-dom";
import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { CalloutProps } from './interfaces';
import {CalloutMessageStyled, CalloutStyled} from './styles';

const Callout: FC<CalloutProps> =
    ({
        message,
        icon,
        hasFoot,
    }) => {
    return ReactDOM.createPortal(
        <CalloutStyled hasFoot={hasFoot}>
            {icon}
            <CalloutMessageStyled>{message}</CalloutMessageStyled>
        </CalloutStyled>, document.getElementById('oc_callout')
    );
}

Callout.defaultProps = {
    hasFoot: true,
}


export {
    Callout,
};

export default withTheme(Callout);