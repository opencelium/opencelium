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
import {connect} from 'react-redux';

import Table from '@basic_components/table/Table';
import {TableHead, TableRow, TableCell} from 'react-toolbox/lib/table';
import styles from '@themes/default/content/dashboard/dashboard.scss';
import SubHeader from "../../../general/view_component/SubHeader";
import {getThemeClass} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * (not used) Recent Syncs component
 */
@connect(mapStateToProps, {})
class RecentSyncs extends Component{

    constructor(props){
        super(props);
    }

    renderSyncs(){
        let {syncs} = this.props;
        return syncs.map((s, key) => {
            return (
                <TableRow key={key}>
                    <TableCell><span>{key + 1}</span></TableCell>
                    <TableCell>
                        <span>{s.connector.from.name}</span> -> <span>{s.connector.to.name}</span>
                    </TableCell>
                    <TableCell>
                        <span>{s.connection.name}</span>
                    </TableCell>
                    <TableCell>
                        <span>{s.time} sec</span>
                    </TableCell>
                    <TableCell>
                        <span>{s.size} KB</span>
                    </TableCell>
                </TableRow>
            );
        });
    }

    render(){
        const {authUser} = this.props;
        let classNames = ['recent_syncs_table'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div>
                <SubHeader title={'Recent Syncs'} authUser={authUser}/>
                <Table selectable={false} theme={{table: styles[classNames.recent_syncs_table]}} authUser={authUser}>
                    <TableHead>
                        <TableCell><span/></TableCell>
                        <TableCell>
                            <span>Connectors</span>
                        </TableCell>
                        <TableCell>
                            <span>Connection</span>
                        </TableCell>
                        <TableCell>
                            <span>Duration Time</span>
                        </TableCell>
                        <TableCell>
                            <span>Size</span>
                        </TableCell>
                    </TableHead>
                    {this.renderSyncs()}
                </Table>
            </div>
        );
    }
}

RecentSyncs.propTypes = {
    syncs: PropTypes.array.isRequired,
};

export default RecentSyncs;