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
import {Col, Row} from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import Endpoint from "@change_component/form_elements/form_connection/form_methods/method/Endpoint";
import ReactDOM from "react-dom";
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";

class Url extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isUrlVisible: false,
        }
        this.endpointRef = React.createRef();
    }

    toggleUrlVisibleIcon(){
        const {setCurrentInfo, nameOfCurrentInfo} = this.props;
        if(setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);
        this.setState({
            isUrlVisible: !this.state.isUrlVisible,
        })
    }

    updateEndpoint(){
        this.toggleUrlVisibleIcon();
    }

    updateConnection(entity = null){
        const {connection, updateConnection} = this.props;
        let currentEntity = entity === null ? connection : entity;
        updateConnection(currentEntity);
    }

    renderInfo(){
        const {connection, method, connector, isExtended, readOnly} = this.props;
        return(
            <React.Fragment>
                <Endpoint
                    readOnly={readOnly}
                    method={connector.getMethodByIndex(method.index)}
                    connector={connector}
                    connection={connection}
                    updateEntity={(a) => this.updateConnection(a)}
                    theme={{
                        queryInput: styles.url_endpoint_query_input,
                        paramGenerator: styles.url_endpoint_param_generator,
                        paramGeneratorForm: styles.url_endpoint_param_generator_form,
                        generatorFormMethod: styles.url_endpoint_generator_form_method,
                        generatorFormParam: styles.url_endpoint_generator_form_param,
                    }}
                    isParamGeneratorArrowVisible={false}
                    isParamGeneratorAlwaysVisible={!readOnly}
                    ref={this.endpointRef}
                />
                {isExtended &&
                    <Button
                        className={styles.extended_details_button_save_url}
                        title={'Save'}
                        onClick={() => this.updateEndpoint()}
                    />
                }
            </React.Fragment>
        );
    }

    render(){
        const {isUrlVisible} = this.state;
        const {isExtended, isCurrentInfo, readOnly} = this.props;
        const label = readOnly ? 'Ok' : 'Apply';
        return(
            <React.Fragment>
                <Col id="url_label" xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Endpoint`}</Col>
                <Col id="url_option" xs={8} className={`${styles.col}`}>
                    <TooltipFontIcon tooltipPosition={'right'} onClick={() => this.toggleUrlVisibleIcon()} size={14} value={<span className={styles.more_details}>{`URL`}</span>} tooltip={'Show'}/>
                </Col>
                {isExtended && isCurrentInfo &&
                    ReactDOM.createPortal(
                        this.renderInfo(), document.getElementById('extended_details_information')
                    )
                }
                <Dialog
                    actions={[{label, onClick: () => this.updateEndpoint(), id: 'endpoint_apply'}]}
                    active={isUrlVisible && !isExtended}
                    toggle={() => this.toggleUrlVisibleIcon()}
                    title={'Endpoint'}
                    theme={{dialog: styles.url_dialog}}
                >
                    {this.renderInfo()}
                </Dialog>
            </React.Fragment>
        );
    }
}

export default Url;
