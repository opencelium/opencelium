 /*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import Table from "@basic_components/table/Table";
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import Button from "@basic_components/buttons/Button";
import {getAllConnections as fetchConnections} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {ListComponent} from "@entity/connection/components/decorators/ListComponent";
import ConnectionFileEntry from "@entity/update_assistant/components/migration/ConnectionFileEntry";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const application = state.applicationReducer;
    const connection = state.connectionReducer;
    return {
        authUser,
        appVersion: application.version,
        fetchingConnections: connection.gettingConnections,
        connections: connection.connections,
    }
}

@connect(mapStateToProps, {fetchConnections})
@withTranslation('update_assistant')
@ListComponent('connections', true)
class ConnectionFileUpdate extends React.Component{
    constructor(props) {
        super(props);
        const {entity} = props;
        this.state = {
            currentConnectionIndex: -1,
            convertedConnections: entity.connectionMigration.updatedConnections,
            isCanceledConvert: false,
        }
    }

    componentDidMount() {
        if(this.props.connections.length === 0){
            this.props.openNextForm();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.connections.length === 0 && !this.props.entity.connectionMigration.isFinishUpdate && this.props.fetchingConnections === API_REQUEST_STATE.FINISH){
            const {entity, updateEntity} = this.props;
            let newEntity = {...entity};
            newEntity.connectionMigration = {...entity.connectionMigration, isFinishUpdate: true};
            updateEntity(newEntity);
        }
    }

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {connections, openNextForm} = this.props;
        if(connections.length > index){
            this.setState({
                currentConnectionIndex: index,
            });
        } else{
            const {convertedConnections} = this.state;
            const connectionsWithErrors = convertedConnections.filter(connection => connection.status !== null);
            const isFinishUpdate = connectionsWithErrors.length === 0;
            const {entity, updateEntity} = this.props;
            let newEntity = {...entity};
            newEntity.connectionMigration = {...entity.connectionMigration, updatedConnections: convertedConnections, isFinishUpdate};
            updateEntity(newEntity);
            this.setState({
                currentConnectionIndex: -1,
            });
            if(isFinishUpdate) {
                openNextForm();
            }
        }
    }

    updateConnections(){
        this.setState({
            convertedConnections: [],
        }, () => this.convert(0));
    }

    setConnection(connection, status, index){
        this.setState({
            convertedConnections: [...this.state.convertedConnections, {data: connection, status}]
        }, () => {
            if(!this.state.isCanceledConvert) {
                this.convert(index + 1)
            } else{
                this.setState({
                    convertedConnections: [],
                    currentConnectionIndex: -1,
                    isCanceledConvert: false,
                })
            }
        });
    }

    render(){
        const {currentConnectionIndex, convertedConnections} = this.state;
        const {t, authUser, connections, appVersion, entity} = this.props;
        if(connections.length === 0){
            return(
                <div>
                    {t('FORM.NO_CONNECTIONS')}
                </div>
            )
        }
        return(
            <div style={{margin: '20px 68px 0px 0px'}}>
                <Table className={styles.table} authUser={authUser}>
                    <thead>
                        <tr>
                            <th>{`${appVersion}`}</th>
                            <th style={{paddingRight: connections.length > 6 ? '35px' : ''}}>{entity.availableUpdates.selectedVersion ? `${entity.availableUpdates.selectedVersion.name}` : ''}</th>
                        </tr>
                    </thead>
                </Table>
                <div className={styles.table_content}>
                    <Table authUser={authUser}>
                        <tbody>
                            {connections.map((connection, key) => (
                                <ConnectionFileEntry
                                    key={connection.connectionId}
                                    index={key}
                                    connection={connection}
                                    setConnection={(a, b, c) => this.setConnection(a, b, c)}
                                    isConverting={currentConnectionIndex === key}
                                    convertedConnections={convertedConnections}
                                    entity={entity}
                                />
                            ))}
                        </tbody>
                    </Table>
                </div>
                {currentConnectionIndex === -1 &&
                    <Button
                        authUser={authUser}
                        title={t('FORM.UPDATE_BUTTON')}
                        onClick={() => this.updateConnections()}
                        float={'right'}
                        margin={'15px 0 40px'}
                    />
                }
                {currentConnectionIndex !== -1 && <TooltipFontIcon isButton={true} tooltip={t('FORM.CANCEL_TOOLTIP')} value={'cancel'} iconClassName={'material-icons-outlined'} className={styles.cancel_icon} onClick={() => this.cancelConvert()}/>}
            </div>
        );
    }
}

export default ConnectionFileUpdate;