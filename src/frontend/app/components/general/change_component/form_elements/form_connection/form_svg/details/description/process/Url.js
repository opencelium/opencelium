import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Dialog from "@basic_components/Dialog";
import Endpoint from "@change_component/form_elements/form_connection/form_methods/method/Endpoint";
import ReactDOM from "react-dom";
import Button from "@basic_components/buttons/Button";

class Url extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isUrlVisible: false,
        }
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

    updateConnection(){
        const {connection, updateConnection} = this.props;
        updateConnection(connection);
    }

    renderInfo(){
        const {connection, method, connector, isExtended} = this.props;
        return(
            <React.Fragment>
                <Endpoint
                    method={connector.getMethodByIndex(method.index)}
                    connector={connector}
                    connection={connection}
                    updateEntity={::this.updateConnection}
                    theme={{
                        queryInput: styles.url_endpoint_query_input,
                        paramGenerator: styles.url_endpoint_param_generator,
                        paramGeneratorForm: styles.url_endpoint_param_generator_form,
                        generatorFormMethod: styles.url_endpoint_generator_form_method,
                        generatorFormParam: styles.url_endpoint_generator_form_param,
                    }}
                    isParamGeneratorArrowVisible={false}
                    isParamGeneratorAlwaysVisible={true}
                />
                {isExtended &&
                    <Button
                        className={styles.extended_details_button_save_url}
                        title={'Save'}
                        onClick={::this.updateEndpoint}
                    />
                }
            </React.Fragment>
        );
    }

    render(){
        const {isUrlVisible} = this.state;
        const {isExtended, isCurrentInfo} = this.props;
        return(
            <React.Fragment>
                <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Endpoint`}</Col>
                <Col xs={8} className={`${styles.col}`}>
                    <TooltipFontIcon onClick={::this.toggleUrlVisibleIcon} size={14} value={<span className={styles.more_details}>{`URL`}</span>} tooltip={'URL'}/>
                </Col>
                {isExtended && isCurrentInfo &&
                    ReactDOM.createPortal(
                        this.renderInfo(), document.getElementById('extended_details_information')
                    )
                }
                <Dialog
                    actions={[{label: 'Apply', onClick: ::this.updateEndpoint, id: 'endpoint_apply'}]}
                    active={isUrlVisible && !isExtended}
                    toggle={::this.toggleUrlVisibleIcon}
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