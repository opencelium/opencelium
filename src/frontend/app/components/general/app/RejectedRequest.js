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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withTranslation} from "react-i18next";
import {history} from "../../App";

import {ERROR_TYPE} from "@utils/constants/app";
import ComponentError from "./ComponentError";
import {checkExpiredMessages, TOKEN_EXPIRED_MESSAGES} from "@utils/app";


/**
 * Component for Rejected Request
 */
@withTranslation('app')
class RejectedRequest extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        const {error} = this.props;
        if(error && error.hasOwnProperty('response') && error.response && error.response.hasOwnProperty('message')){
            if(checkExpiredMessages(error)){
                history.push('/login');
            }
        }
    }

    render(){
        const {entityName} = this.props;
        return <ComponentError
            entity={{type: ERROR_TYPE.BACKEND, name: entityName}}
            manualVisible={true}
        />;
    }
}

RejectedRequest.propTypes = {
    entityName: PropTypes.string.isRequired,
};

export default RejectedRequest;