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
import {connect} from 'react-redux';
import {isString} from "@application/utils/utils";
import {Col, Row} from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Name from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Name";
import Label
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Label";
import Url from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Url";
import Header
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Header";
import Body from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Body";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {toggleRequestBodyDialog, toggleResponseSuccessBodyDialog, toggleResponseFailBodyDialog} from "@root/redux_toolkit/slices/EditorSlice";
import {withTheme} from "styled-components";
import DataAggregator
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/DataAggregator";

import { setModalCurrentTechnicalItem } from '@entity/connection/redux_toolkit/slices/ModalConnectionSlice';
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';
import TestMethodButton
    from "@change_component/form_elements/form_connection/form_svg/details/test_method/TestMethodButton";
function mapStateToProps(state){
    const editor = state.connectionEditorReducer;
    return{
        isRequestBodyDialogOpened: editor.isRequestBodyDialogOpened,
        isResponseSuccessDialogOpened: editor.isResponseSuccessDialogOpened,
        isResponseFailDialogOpened: editor.isResponseFailDialogOpened,
    };
}

@GetModalProp()
@connect(mapStateToProps, { setCurrentTechnicalItem, setModalCurrentTechnicalItem, toggleRequestBodyDialog, toggleResponseSuccessBodyDialog, toggleResponseFailBodyDialog }, null, {forwardRef: true})
class TechnicalProcessDescription extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isResponseVisible: false,
    };
    this.setCurrentTechnicalItem = props.isModal
      ? props.setModalCurrentTechnicalItem
      : props.setCurrentTechnicalItem;
    this.urlRef = React.createRef();
    this.nameRef = React.createRef();
    this.headerRef = React.createRef();
    this.labelRef = React.createRef();
    this.bodyRef = React.createRef();
  }



  toggleResponseVisibleIcon() {
    this.setState({
      isResponseVisible: !this.state.isResponseVisible,
    });
  }

  changeLabel(label) {
    const { connection, details, updateConnection } = this.props;
    const connector = connection.getConnectorByType(details.connectorType);
    const method = connector.getMethodByColor(details.entity.color);
    method.label = label;
    const currentTechnicalItem = connector.getSvgElementByIndex(method.index);
    updateConnection(connection);
    this.setCurrentTechnicalItem(currentTechnicalItem.getObject());
  }

    updateConnection(connection) {
        const { details, updateConnection } = this.props;
        const connector = connection.getConnectorByType(details.connectorType);
        const method = connector.getMethodByColor(details.entity.color);
        const currentTechnicalItem = connector.getSvgElementByIndex(method.index);
        updateConnection(connection);
        this.setCurrentTechnicalItem(currentTechnicalItem.getObject());
    }
    render(){
        const {isResponseVisible} = this.state;
        const {details, connection, updateConnection, isExtended, currentInfo, setCurrentInfo, readOnly,
            isResponseFailDialogOpened, isResponseSuccessDialogOpened, isRequestBodyDialogOpened,
            toggleRequestBodyDialog, toggleResponseSuccessBodyDialog, toggleResponseFailBodyDialog,
            theme, setCurrentTechnicalItem,
        } = this.props;
        const methodItem = details.entity;
        const connector = connection.getConnectorByType(details.connectorType);
        const request = methodItem.request;
        const successResponse = methodItem.response.success;
        const failResponse = methodItem.response.fail;
        let invokerName = methodItem && methodItem.invoker && isString(methodItem.invoker.name) ? methodItem.invoker.name : '';
        let requestFormat = details && isString(methodItem.bodyFormat) ? methodItem.bodyFormat : '';
        if(invokerName === '') invokerName = 'is empty';
        if(requestFormat === '') requestFormat = 'is empty';
        let generalDataEntries = [
            {name: 'Invoker', value: invokerName},
            {name: 'Format', value: requestFormat},
        ];
        const label = details && details.entity ? details.entity.label || '' : '';
        const errors = connector ? connector.getMethodByIndex(methodItem.index)?.error || null : null;
        const hasErrors = errors ? !!errors.hasError : false;
        const isErrorLocationRequest = hasErrors ? errors?.location.indexOf('request') !== -1 : false;
        const isErrorLocationBody = hasErrors ? errors?.location.indexOf('body') !== -1 : false;
        const errorColor = theme?.input?.error?.color || '#9b2e2e';
        return(
            <Row className={styles.row}>
                <Name {...this.props} ref={this.nameRef}/>
                <Label
                    {...this.props}
                    ref={this.labelRef}
                    label={label}
                    changeLabel={(a) => this.changeLabel(a)}
                    text={'Label'}
                />
                {generalDataEntries.map(entry => {
                    return(
                        <React.Fragment key={entry.name}>
                            <Col xs={4} className={styles.col}>{`${entry.name}:`}</Col>
                            <Col xs={8} className={`${styles.col}`}>
                                <span className={styles.value}>{entry.value}
                                </span>
                            </Col>
                        </React.Fragment>
                    )
                })}
                {/*{requestFormat === 'json' && <TestMethodButton connection={connection}/>}*/}
                <DataAggregator
                    details={details}
                    connection={connection}
                    currentItem={details.entity}
                    updateConnection={updateConnection}
                />
                <Col xs={12} className={styles.col} style={{marginTop: "20px"}}><b>{`Request`}</b></Col>
                <Col xs={12} className={styles.col} style={{marginBottom: '10px'}}>
                    <Row className={styles.row}>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Method:`}</Col>
                        <Col xs={8} className={`${styles.col}`}><span className={styles.value}>{request.method}</span></Col>
                        <Url
                            readOnly={readOnly}
                            nameOfCurrentInfo={'request_url'}
                            isCurrentInfo={currentInfo === 'request_url'}
                            setCurrentInfo={setCurrentInfo}
                            isExtended={isExtended}
                            request={request}
                            connection={connection}
                            updateConnection={(a) => this.updateConnection(a)}
                            method={methodItem}
                            connector={connector}
                            ref={this.urlRef}
                        />
                        <Header
                            nameOfCurrentInfo={'request_header'}
                            isCurrentInfo={currentInfo === 'request_header'}
                            setCurrentInfo={setCurrentInfo}
                            isExtended={isExtended}
                            items={request.header}
                            ref={this.headerRef}
                        />
                        <Body toggleBodyDialog={toggleRequestBodyDialog} isBodyDialogOpened={isRequestBodyDialogOpened} readOnly={readOnly} nameOfCurrentInfo={'request_body'} isCurrentInfo={currentInfo === 'request_body'} setCurrentInfo={setCurrentInfo} isExtended={isExtended} source={request.getBodyFields()} connection={connection} connector={connector} updateConnection={(a) => this.updateConnection(a)} method={methodItem}
                              bodyTitle={"Request data"}
                              hasError={isErrorLocationRequest && isErrorLocationBody}
                              ref={this.bodyRef}
                        />
                    </Row>
                </Col>
                {
                    isErrorLocationRequest ? errors.messages.map(error => {
                        return <div style={{color: errorColor}}>{error}</div>
                    }) : null
                }
                <Col xs={12} className={styles.col} id="response_label">
                    <b>{`Response`}</b>
                    <TooltipFontIcon className={styles.response_toggle_icon} onClick={(a) => this.toggleResponseVisibleIcon(a)} tooltip={isResponseVisible ? 'Hide' : 'Show'} value={isResponseVisible ? 'arrow_drop_up' : 'arrow_drop_down'}/>
                </Col>
                {isResponseVisible &&
                <Col xs={12} className={styles.col}>
                    <Row className={styles.row}>
                        <Col xs={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Success`}</b></Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                        <Col xs={8} className={`${styles.col}`}>{successResponse.status}</Col>
                        <Header nameOfCurrentInfo={'success_header'} isCurrentInfo={currentInfo === 'success_header'} setCurrentInfo={setCurrentInfo} isExtended={isExtended} items={successResponse.header}/>
                        <Body hasEnhancement={false} toggleBodyDialog={toggleResponseSuccessBodyDialog} isBodyDialogOpened={isResponseSuccessDialogOpened} nameOfCurrentInfo={'success_body'} isCurrentInfo={currentInfo === 'success_body'} setCurrentInfo={setCurrentInfo} isExtended={isExtended} source={successResponse.getBodyFields()} readOnly={true} connection={connection} connector={connector} updateConnection={(a) => this.updateConnection(a)} method={methodItem} bodyTitle={'Response. Success data'}/>
                        <Col style={{marginTop: '10px'}} xs={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Fail`}</b></Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                        <Col xs={8} className={`${styles.col}`}>{failResponse.status}</Col>
                        <Header nameOfCurrentInfo={'fail_header'} isCurrentInfo={currentInfo === 'fail_header'} setCurrentInfo={setCurrentInfo} isExtended={isExtended} items={failResponse.header}/>
                        <Body hasEnhancement={false} toggleBodyDialog={toggleResponseFailBodyDialog} isBodyDialogOpened={isResponseFailDialogOpened} nameOfCurrentInfo={'fail_body'} isCurrentInfo={currentInfo === 'fail_body'} setCurrentInfo={setCurrentInfo} isExtended={isExtended} source={failResponse.getBodyFields()} readOnly={true} connection={connection} connector={connector} updateConnection={(a) => this.updateConnection(a)} method={methodItem} bodyTitle={'Response. Fail data'}/>
                    </Row>
                </Col>
                }
            </Row>
        );
      }
}

export default withTheme(TechnicalProcessDescription);
