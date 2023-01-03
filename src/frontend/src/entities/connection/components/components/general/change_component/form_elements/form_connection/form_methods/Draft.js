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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Row, Col} from "react-grid-system";
import FormMethods from "@change_component/form_elements/form_connection/form_methods/FormMethods";
import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import {connect} from "react-redux";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {setConnectionDraftWasOpened} from "@entity/connection/redux_toolkit/slices/ConnectionSlice"
import {LocalStorage} from "@application/classes/LocalStorage";

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const isDraftOpenedOnce = state.applicationReducer.isDraftOpenedOnce;
    return{
        authUser,
        isDraftOpenedOnce,
    };
}


@connect(mapStateToProps, {setConnectionDraftWasOpened})
class Draft extends Component{
    constructor(props) {
        super(props);
        const storage = LocalStorage.getStorage();
        let connection = storage.get(`${props.connection.fromConnector.invoker.name}&${props.connection.toConnector.invoker.name}`);
        this.state = {
            isVisibleDraft: true,
            draftConnection: connection ? CConnection.createConnection(JSON.parse(connection)) : null,
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const storage = LocalStorage.getStorage();
        let connection = storage.get(`${this.props.connection.fromConnector.invoker.name}&${this.props.connection.toConnector.invoker.name}`);
        if(this.state.draftConnection === null && connection){
            this.setState({
                draftConnection: connection ? CConnection.createConnection(JSON.parse(connection)) : null,
            });
        }
    }

    updateEntity(){
        this.setState({
            draftConnection: this.state.draftConnection,
        })
    }

    toggleDraft(){
        if(this.state.isVisibleDraft){
            this.props.setConnectionDraftWasOpened()
        }
        this.setState({
            isVisibleDraft: !this.state.isVisibleDraft,
        });
    }

    deleteDraft(){
        const {connection} = this.props;
        const storage = LocalStorage.getStorage();
        storage.remove(`${connection.fromConnector.invoker.name}&${connection.toConnector.invoker.name}`);
        this.toggleDraft();
    }

    loadDraft(){
        let {draftConnection} = this.state;
        let {connection, updateEntity} = this.props;
        draftConnection.fromConnector.invoker = connection.fromConnector.invoker;
        draftConnection.fromConnector.setCurrentItem(connection.fromConnector.methods[connection.fromConnector.methods.length - 1]);
        draftConnection.fromConnector.setConnectorType(CONNECTOR_FROM);
        draftConnection.fromConnector.title = connection.fromConnector.title;
        connection.fromConnector = draftConnection.fromConnector;
        draftConnection.toConnector.invoker = connection.toConnector.invoker;
        draftConnection.toConnector.setCurrentItem(connection.toConnector.methods[connection.toConnector.methods.length - 1]);
        draftConnection.toConnector.setConnectorType(CONNECTOR_TO);
        draftConnection.toConnector.title = connection.toConnector.title;
        connection.toConnector = draftConnection.toConnector;
        connection.fieldBinding = draftConnection.fieldBinding;
        updateEntity(connection);
        this.toggleDraft();
    }

    render(){
        const {isVisibleDraft, draftConnection} = this.state;
        const {connection, isDraftOpenedOnce} = this.props;
        const data = {
            visible: true,
            readOnly: true,
        };
        if(isDraftOpenedOnce || draftConnection === null
            || !(connection.fromConnector.methods.length === 0 && connection.fromConnector.operators.length === 0 && connection.toConnector.methods.length === 0 && connection.toConnector.operators.length === 0)
            || (draftConnection.fromConnector.methods.length === 0 && draftConnection.fromConnector.operators.length === 0 && draftConnection.toConnector.methods.length === 0 && draftConnection.toConnector.operators.length === 0)){
            return null;
        }
        return(
            <Dialog
                actions={[{label: 'Delete', onClick: (a) => this.deleteDraft(a), id: 'draft_dialog_delete'},{label: 'Load', onClick: (a) => this.loadDraft(a), id: 'draft_dialog_load'},{label: 'Cancel', onClick: (a) => this.toggleDraft(a), id: 'draft_dialog_cancel'}]}
                active={isVisibleDraft}
                toggle={(a) => this.toggleDraft(a)}
                title={'Draft'}
                theme={{dialog: styles.draft_dialog}}
            >
                <div className={styles.draft}>
                    <Row className={styles.connectors}><Col xl={6}>{connection.fromConnector.invoker.name}</Col><Col xl={6}>{connection.toConnector.invoker.name}</Col></Row>
                    <div className={styles.draft_connection}>
                        <FormMethods entity={draftConnection} data={data} isDraft={true} updateEntity={(a) => this.updateEntity(a)} noMethodTitle={true}/>
                    </div>
                </div>
            </Dialog>
        );
    }
}


Draft.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    updateEntity: PropTypes.func.isRequired,
};

export default Draft;