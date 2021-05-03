/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

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