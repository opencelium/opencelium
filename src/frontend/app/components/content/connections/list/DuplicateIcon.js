import React from 'react';
import Dialog from "@basic_components/Dialog";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {fetchConnectors} from '@actions/connectors/fetch';
import {checkConnectionTitle} from '@actions/connections/fetch';
import {addConnection} from "@actions/connections/add";
import {fetchConnection} from "@actions/connections/fetch";
import {connect} from "react-redux";
import Loading from "@components/general/app/Loading";
import Input from "@basic_components/inputs/Input";
import {withTranslation} from "react-i18next";
import Select from "@basic_components/inputs/Select";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {setFocusById} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    const connectors = state.get('connectors');
    return{
        authUser: auth.get('authUser'),
        connection: connections.get('connection'),
        fetchingConnection: connections.get('fetchingConnection'),
        addingConnection: connections.get('addingConnection'),
        checkingConnectionTitle: connections.get('checkingConnectionTitle'),
        checkTitleResult: connections.get('checkTitleResult'),
        connectors: connectors.get('connectors').toJS(),
        fetchingConnectors: connectors.get('fetchingConnectors'),
    };
}

@connect(mapStateToProps, {fetchConnection, fetchConnectors, addConnection, checkConnectionTitle})
@withTranslation(['connections'])
class DuplicateIcon extends React.Component{
    constructor(props) {
        super(props);
        
        this.state = {
            isOpened: false,
            title: '',
            fromConnector: null,
            toConnector: null,
            validateMessageTitle: '',
            validateMessageFromConnector: '',
            validateMessageToConnector: '',
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {t} = this.props;
        if(!prevState.isOpened && this.state.isOpened || prevProps.listConnection.connectionId !== this.props.listConnection.connectionId){
            this.props.fetchConnection({id: this.props.listConnection.connectionId})
            this.props.fetchConnectors();
        }
        if(prevProps.checkingConnectionTitle === API_REQUEST_STATE.START && this.props.checkingConnectionTitle === API_REQUEST_STATE.FINISH){
            if(this.props.checkTitleResult.message !== 'EXISTS' && this.props.addingConnection !== API_REQUEST_STATE.START){
                this.duplicate();
            } else{
                this.setState({
                    validateMessageTitle: t('ADD.VALIDATION_MESSAGES.TITLE_EXIST')
                })
                setFocusById('duplicate_title')
            }
        }
    }

    onChangeTitle(title){
        this.setState({
            title,
            validateMessageTitle: '',
        });
    }

    onChangeFromConnector(fromConnector){
        this.setState({
            fromConnector,
            validateMessageFromConnector: '',
        });
    }

    onChangeToConnector(toConnector){
        this.setState({
            toConnector,
            validateMessageToConnector: '',
        });
    }

    toggleDuplicateForm(){
        let newState = {isOpened: !this.state.isOpened};
        if(!!this.state.isOpened){
            newState.title = '';
            newState.fromConnector = null;
            newState.toConnector = null;
        }
        this.setState({
            ...newState,
        })
    }

    validateFields(){
        const {title, fromConnector, toConnector} = this.state;
        const {t, checkConnectionTitle} = this.props;
        let validateMessageTitle = '';
        let validateMessageFromConnector = '';
        let validateMessageToConnector = '';
        if(title === ''){
            validateMessageTitle = t(`ADD.VALIDATION_MESSAGES.TITLE_REQUIRED`);
            setFocusById('duplicate_title');
        }
        if(!fromConnector){
            validateMessageFromConnector = t(`ADD.VALIDATION_MESSAGES.FROM_CONNECTOR_REQUIRED`);
            if(validateMessageTitle === '') setFocusById('duplicate_from_connector');
        }
        if(!toConnector){
            validateMessageToConnector = t(`ADD.VALIDATION_MESSAGES.TO_CONNECTOR_REQUIRED`);
            if(validateMessageTitle === '' && validateMessageFromConnector === '') setFocusById('duplicate_to_connector');
        }
        this.setState({
            validateMessageTitle,
            validateMessageFromConnector,
            validateMessageToConnector
        }, () => {
            if(title !== '' && fromConnector && toConnector){
                checkConnectionTitle({title});
            }
        });
        return false;
    }

    duplicate(){
        const {title, fromConnector, toConnector} = this.state;
        const {connection, connectors, addConnection} = this.props;
        const fromConnectorData = fromConnector ? connectors.find(connector => connector.id === fromConnector.value) : null;
        const toConnectorData = toConnector ? connectors.find(connector => connector.id === toConnector.value) : null;
        if(fromConnectorData && toConnectorData) {
            connection.title = title;
            connection.fromConnector.connectorId = fromConnectorData.id;
            connection.fromConnector.title = fromConnectorData.name;
            connection.fromConnector.icon = fromConnectorData.icon;
            connection.toConnector.connectorId = toConnectorData.id;
            connection.toConnector.title = toConnectorData.name;
            connection.toConnector.icon = toConnectorData.icon;
            delete connection.connectionId;
            if(connection.businessLayout){
                delete connection.businessLayout.id;
            }
            addConnection(connection);
            this.toggleDuplicateForm();
        }
    }

    render(){
        const {isOpened, validateMessageTitle, validateMessageFromConnector, validateMessageToConnector, title, fromConnector, toConnector} = this.state;
        const {t, connection, listConnection, connectors, fetchingConnection, fetchingConnectors, checkingConnectionTitle} = this.props;
        const fromConnectorOptions = connectors.filter(connector => connector.invoker.name === listConnection.fromConnector.invoker.name).map(connector => {return {label: connector.name, value: connector.id}});
        const toConnectorOptions = connectors.filter(connector => connector.invoker.name === listConnection.toConnector.invoker.name).map(connector => {return {label: connector.name, value: connector.id}});
        const isLoading = fetchingConnection !== API_REQUEST_STATE.FINISH || fetchingConnectors !== API_REQUEST_STATE.FINISH || connection.connectionId !== listConnection.connectionId;
        return(
            <React.Fragment>
                <TooltipFontIcon wrapStyles={{marginRight: '2px'}} isButton turquoiseTheme value={'content_copy'} tooltip={'Create Duplicate'} onClick={::this.toggleDuplicateForm}/>
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.validateFields}, {label: 'Cancel', onClick: ::this.toggleDuplicateForm}]}
                    active={isOpened}
                    toggle={::this.toggleDuplicateForm}
                    title={'Create Duplicate'}
                >
                    {isLoading ? <Loading/> :
                        <React.Fragment>
                            <Input id={'duplicate_title'} value={title} onChange={::this.onChangeTitle} isLoading={checkingConnectionTitle === API_REQUEST_STATE.START} error={validateMessageTitle} autoFocus required icon={'title'} maxLength={256} label={t(`ADD.FORM.TITLE`)}/>
                            <Select id={'duplicate_from_connector'} value={fromConnector} onChange={::this.onChangeFromConnector} error={validateMessageFromConnector} required icon={'device_hub'} label={t(`LIST.FROM_CONNECTOR`)} options={fromConnectorOptions}/>
                            <Select id={'duplicate_to_connector'} value={toConnector} onChange={::this.onChangeToConnector} error={validateMessageToConnector} required icon={'device_hub'} label={t(`LIST.TO_CONNECTOR`)} options={toConnectorOptions}/>
                        </React.Fragment>
                    }
                </Dialog>
            </React.Fragment>
        );
    }
}

export default DuplicateIcon;