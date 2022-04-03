 

/*
 * Copyright (C) <2022>  <becon GmbH>
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
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Dialog from "@basic_components/Dialog";
import UrlField from "./UrlField";
import CRequest from "@classes/components/content/invoker/request/CRequest";
import styles from "@themes/default/general/change_component.scss";
import {sendOperationRequest} from "@actions/connections/fetch";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import TabItem from "./TabItem";
import CSuccess from "@classes/components/content/invoker/response/CSuccess";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Loading from "@loading";


function mapStateToProps(state){
    const connection = state.connectionReducer;
    return {
        response: connection.operationResponse,
        sendingOperationRequest: connection.sendingOperationRequest,
    };
}

@connect(mapStateToProps, {sendOperationRequest})
class RequestIcon extends Component{
    constructor(props) {
        super(props);

        this.state = {
            showRequestDialog: false,
            request: CRequest.createRequest(this.getRequest()),
            activeTab: 'request',
            startSendingRequest: false,
        };
    }

    componentDidUpdate(){
        if(this.state.startSendingRequest && this.props.sendingOperationRequest !== API_REQUEST_STATE.START){
            this.setState({
                startSendingRequest: false,
                activeTab: 'response'
            });
        }
    }

    toggleShowRequestDialog(){
        this.setState({
            showRequestDialog: !this.state.showRequestDialog,
            request: CRequest.createRequest(this.getRequest()),
        });
    }

    handleTabChange(activeTab){
        this.setState({activeTab});
    }

    updateRequest(){
        this.setState({
            request: this.state.request,
        });
    }

    sendRequest(){
        const {request} = this.state;
        const {sendOperationRequest} = this.props;
        this.setState({
            startSendingRequest: true,
        });
        sendOperationRequest(request.getObject({bodyOnlyConvert: true}));
    }

    getRequest(){
        const {request, requestData} = this.props;
        let endpoint = request.endpoint;
        let body = JSON.stringify(request.getBodyFields());
        if(requestData){
            for(let param in requestData){
                endpoint = endpoint.split(`{${param}}`).join(requestData[param]);
                body = body.split(`{${param}}`).join(requestData[param]);
            }
        }
        request.endpoint = endpoint;
        request.setBodyFields(JSON.parse(body));
        return request;
    }
    
    render(){
        const {showRequestDialog, request, activeTab, startSendingRequest} = this.state;
        const {isVisible, response, connectorType, requestData, hasAddMethod} = this.props;
        const responseEntity = CSuccess.createSuccess(response);
        const style = {};
        if(connectorType === CONNECTOR_FROM){
            style.right = hasAddMethod ? '40px' : '3px';
        } else{
            style.left = hasAddMethod ? '40px' : '3px';
        }
        return(
            <div className={connectorType === CONNECTOR_FROM ? styles.connection_request_icon_left : styles.connection_request_icon_right} style={style}>
                {isVisible && <TooltipFontIcon tooltip={'API Request'} value={'cloud_upload'} onClick={(a) => this.toggleShowRequestDialog(a)}/>}
                <Dialog
                    actions={[{label: 'Close', onClick: (a) => this.toggleShowRequestDialog(a), id: 'request_dialog_close'}]}
                    active={showRequestDialog}
                    toggle={(a) => this.toggleShowRequestDialog(a)}
                    title={'Request'}
                    theme={{dialog: styles.request_icon_dialog}}
                >
                    <UrlField requestData={requestData} request={request} update={(a) => this.updateRequest(a)} sendRequest={(a) => this.sendRequest(a)} isLoading={startSendingRequest}/>
                    <Tabs activeKey={activeTab} onSelect={(a) => this.handleTabChange(a)} className={styles.connection_request_tabs}>
                        <Tab title='Request' eventKey={'request'}>
                            <TabItem entity={request} update={(a) => this.updateRequest(a)}/>
                        </Tab>
                        <Tab title={startSendingRequest ? <Loading className={styles.connection_request_tab_loading}/> : 'Response'} eventKey={'response'}>
                            <TabItem entity={responseEntity} readOnly={true}/>
                        </Tab>
                    </Tabs>
                </Dialog>
            </div>
        );
    }
}

RequestIcon.propTypes = {
    request: PropTypes.instanceOf(CRequest).isRequired,
    hasAddMethod: PropTypes.bool,
};

RequestIcon.defaultProps = {
    isVisible: false,
    hasAddMethod: false,
};

export default RequestIcon;