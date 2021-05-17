import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Dialog from "@basic_components/Dialog";
import Endpoint from "@change_component/form_elements/form_connection/form_methods/method/Endpoint";

class Url extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isUrlVisible: false,
        }
    }

    toggleUrlVisibleIcon(){
        this.setState({
            isUrlVisible: !this.state.isUrlVisible,
        })
    }

    updateEndpoint(){
        this.toggleUrlVisibleIcon();
    }

    render(){
        const {isUrlVisible} = this.state;
        const {connection, updateConnection, method} = this.props;
        const connector = connection.getConnectorByMethodIndex(method);
        return(
            <React.Fragment>
                <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Endpoint`}</Col>
                <Col xs={8} className={`${styles.col} ${styles.more_details}`}>
                    <TooltipFontIcon onClick={::this.toggleUrlVisibleIcon} size={14} value={<span>{`URL`}</span>} tooltip={'URL'}/>
                </Col>
                <Dialog
                    actions={[{label: 'Apply', onClick: ::this.updateEndpoint, id: 'endpoint_apply'}]}
                    active={isUrlVisible}
                    toggle={::this.toggleUrlVisibleIcon}
                    title={'Endpoint'}
                    theme={{dialog: styles.url_dialog}}
                >
                    <Endpoint
                        method={connector.getMethodByIndex(method.index)}
                        connector={connector}
                        connection={connection}
                        updateEntity={updateConnection}
                    />
                </Dialog>
            </React.Fragment>
        );
    }
}

export default Url;