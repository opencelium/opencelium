/*
 * Copyright (C) <2020>  <becon GmbH>
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
import CRequest from "@classes/components/content/invoker/request/CRequest";
import Body from "../Body";
import Header from "../header/Header";
import CResponse from "@classes/components/content/invoker/response/CResponse";


/**
 * Component for RequestField in Invoker.ResponseItem
 */
class TabItem extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {entity, update, readOnly} = this.props;
        let mode = '';
        if(entity instanceof CRequest){
            mode = 'add';
        }
        return (
            <>
                <div style={{marginTop: '20px'}}>
                    <Header
                        updateEntity={update}
                        entity={entity}
                        data={{readOnly}}
                        noIcon={true}
                        hasHeightLimits={true}
                        mode={mode}
                    />
                </div>
                <Body
                    entity={entity}
                    data={{icon: '', readOnly}}
                    updateEntity={update}
                    hasHeightLimits={true}
                />
            </>
        );
    }
}

TabItem.propTypes = {
    entity: PropTypes.oneOfType([
        PropTypes.instanceOf(CResponse),
        PropTypes.instanceOf(CRequest)
    ]).isRequired,
    update: PropTypes.func,
    readOnly: PropTypes.bool,
};

TabItem.defaultProps = {
    readOnly: false,
};


export default TabItem;