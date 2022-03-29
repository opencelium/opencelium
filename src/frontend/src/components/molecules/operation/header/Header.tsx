import React, {FC} from 'react';
import {HeaderProps} from "@molecule/operation/interfaces";
import InputJsonView from "@atom/input/json_view/InputJsonView";


const Header: FC<HeaderProps> =
    ({
        updateHeader,
        readOnly,
        value,
        ...props
    }) => {
        return(
            <InputJsonView
                readOnly={readOnly}
                icon={'data_object'}
                label={'Header'}
                updateJson={updateHeader}
                jsonViewProps={{
                    name: false,
                    style: {marginBottom: '0px'},
                    collapsed: false,
                    src: value === null ? {} : value,
                }}
            />
        )
    }

Header.defaultProps = {
}


export {
    Header,
};
