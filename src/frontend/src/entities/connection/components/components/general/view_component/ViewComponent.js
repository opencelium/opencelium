/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import styles from '@entity/connection/components/themes/default/general/view_component.scss';
import ListHeader from "@entity/connection/components/components/general/list_of_components/Header";
import ListButton from "@entity/connection/components/components/general/view_component/ListButton";
import {permission} from "@entity/connection/components/decorators/permission";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    };
}

@connect(mapStateToProps, {})
@permission()
class ViewComponent extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {header, listButton} = this.props;
        return(
            <div>
                <ListHeader header={header}/>
                {listButton &&
                    <ListButton
                        title={listButton.title}
                        link={listButton.link}
                        permission={listButton.permission}
                    />
                }
                <div className={styles.view_component}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

ViewComponent.propTypes = {
    header: PropTypes.string.isRequired,
    listButton: PropTypes.shape({
        title: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
    }),
    permission: PropTypes.string.isRequired,
}

export default ViewComponent;