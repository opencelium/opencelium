/*
 * Copyright (C) <2019>  <becon GmbH>
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

import {ERROR_TYPE} from "../../../utils/constants/app";
import ComponentError from "./ComponentError";


/**
 * Component for Rejected Request
 */
@withTranslation('app')
class RejectedRequest extends Component{

    constructor(props){
        super(props);
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