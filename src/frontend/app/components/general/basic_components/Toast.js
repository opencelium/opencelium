import React from 'react';

import PropTypes from 'prop-types';
import {Toast, ToastHeader, ToastBody} from 'reactstrap';

class OCToast extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {header, body, left, top} = this.props;
        return(
            <span>
                <Toast style={{position: "absolute", left, top, zIndex: 1000000}}>
                    <ToastHeader>
                        {header}
                    </ToastHeader>
                    <ToastBody>
                        {body}
                    </ToastBody>
                </Toast>
            </span>
        );
    }
}

OCToast.propTypes = {
    header: PropTypes.any.isRequired,
    body: PropTypes.any.isRequired,
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
}

export default OCToast;