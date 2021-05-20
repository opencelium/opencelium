import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Dialog from "@basic_components/Dialog";
import {BODY_FORMAT} from "@classes/components/content/invoker/CBody";
import JsonBody from "@change_component/form_elements/form_connection/form_methods/method/JsonBody";
import XmlBody from "@change_component/form_elements/form_connection/form_methods/method/XmlBody";
import Enhancement from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement";
import {CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";

class Body extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isBodyVisible: false,
            enhancementComponent: null,
        }
    }
    toggleBodyVisible(){
        const {connection, updateConnection} = this.props;
        connection.currentEnhancemnet = null;
        updateConnection();
        this.setState({
            isBodyVisible: !this.state.isBodyVisible,
        });
    }

    renderBody(){
        const {readOnly, method, connection, updateConnection, isDraft, source} = this.props;
        const connector = connection.getConnectorByMethodIndex(method);
        switch(method.bodyFormat){
            case BODY_FORMAT.JSON:
                return (
                    <JsonBody
                        id={'description_body'}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={connector.getMethodByIndex(method.index)}
                        connection={connection}
                        connector={connector}
                        updateEntity={updateConnection}
                        noPlaceholder={true}
                        source={source}
                    />
                );
            case BODY_FORMAT.XML:
                return (
                    <XmlBody
                        id={'description_body'}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={connector.getMethodByIndex(method.index)}
                        connection={connection}
                        connector={connector}
                        updateEntity={updateConnection}
                        noPlaceholder={true}
                        source={source}
                    />
                );
        }
    }

    renderEnhancement(){
        const {connection} = this.props;
        if(!connection.currentEnhancement){
            return (
                <div className={styles.body_reference_not_selected_message}>
                    Please, click on the reference
                </div>
            );
        }
        const enhancementData = this.getEnhancementData();
        return null;
        return(
            <div className={styles.data}>
                <Enhancement {...enhancementData}/>
            </div>
        );
    }

    render(){
        const {isBodyVisible} = this.state;
        const {bodyTitle, connection, method} = this.props;
        const connector = connection.getConnectorByMethodIndex(method);
        const hasEnhancement = connector.getConnectorType() === CONNECTOR_TO;
        return(
            <React.Fragment>
                <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                <Col xs={8} className={`${styles.col} ${styles.more_details}`}>
                    <TooltipFontIcon onClick={::this.toggleBodyVisible} size={14} value={<span>{`...`}</span>} tooltip={'Body'}/>
                </Col>
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.toggleBodyVisible, id: 'header_ok'}]}
                    active={isBodyVisible}
                    toggle={::this.toggleBodyVisible}
                    title={'Body'}
                    theme={{dialog: hasEnhancement ? styles.body_dialog_with_enhancement : styles.body_dialog, content: styles.body_content}}
                >
                    <div className={hasEnhancement ? styles.body_data_with_enhancement : styles.body_data}>
                        <div><b>{bodyTitle}</b></div>
                        {this.renderBody()}
                    </div>
                    {hasEnhancement &&
                        <div className={styles.body_enhancement}>
                            <div><b>{'Enhancement'}</b></div>
                            {this.renderEnhancement()}
                        </div>
                    }
                </Dialog>
            </React.Fragment>
        );
    }
}

Body.defaultProps = {
    isDraft: false,
};

export default Body;