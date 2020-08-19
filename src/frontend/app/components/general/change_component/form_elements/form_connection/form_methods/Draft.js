import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Row, Col} from "react-grid-system";
import FormMethods from "@change_component/form_elements/form_connection/form_methods/FormMethods";
import styles from '@themes/default/general/change_component.scss';
import Dialog from "@basic_components/Dialog";
import CConnection from "@classes/components/content/connection/CConnection";
import {getLS, removeLS} from "@utils/LocalStorage";
import {connect} from "react-redux";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}


@connect(mapStateToProps, {})
class Draft extends Component{
    constructor(props) {
        super(props);
        let connection = getLS(`${props.connection.fromConnector.invoker.name}&${props.connection.toConnector.invoker.name}`, `connection_${props.authUser.userId}`);
        this.state = {
            isVisibleDraft: true,
            draftConnection: connection ? CConnection.createConnection(JSON.parse(connection)) : null,
        };
    }

    updateEntity(){
        this.setState({
            draftConnection: this.state.draftConnection,
        })
    }

    toggleDraft(){
        this.setState({
            isVisibleDraft: !this.state.isVisibleDraft,
        });
    }

    deleteDraft(){
        const {authUser, connection} = this.props;
        removeLS(`${connection.fromConnector.invoker.name}&${connection.toConnector.invoker.name}`, `connection_${authUser.userId}`);
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
        const {authUser, connection} = this.props;
        const data = {
            visible: true,
            readOnly: true,
        };
        if(draftConnection === null
            || !(connection.fromConnector.methods.length === 0 && connection.fromConnector.operators.length === 0 && connection.toConnector.methods.length === 0 && connection.toConnector.operators.length === 0)
            || (draftConnection.fromConnector.methods.length === 0 && draftConnection.fromConnector.operators.length === 0 && draftConnection.toConnector.methods.length === 0 && draftConnection.toConnector.operators.length === 0)){
            return null;
        }
        return(
            <Dialog
                actions={[{label: 'Delete', onClick: ::this.deleteDraft, id: 'draft_dialog_delete'},{label: 'Load', onClick: ::this.loadDraft, id: 'draft_dialog_load'},{label: 'Cancel', onClick: ::this.toggleDraft, id: 'draft_dialog_cancel'}]}
                active={isVisibleDraft}
                onEscKeyDown={::this.toggleDraft}
                onOverlayClick={::this.toggleDraft}
                title={'Draft'}
            >
                <div className={styles.draft}>
                    <Row className={styles.connectors}><Col xl={6}>{connection.fromConnector.invoker.name}</Col><Col xl={6}>{connection.toConnector.invoker.name}</Col></Row>
                    <div className={styles.draft_connection}>
                        <FormMethods entity={draftConnection} data={data} isDraft={true} updateEntity={::this.updateEntity} noMethodTitle={true}/>
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