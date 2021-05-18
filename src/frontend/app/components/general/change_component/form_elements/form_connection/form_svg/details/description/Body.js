import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Dialog from "@basic_components/Dialog";
import Table from "@basic_components/table/Table";
import {BODY_FORMAT} from "@classes/components/content/invoker/CBody";
import JsonBody from "@change_component/form_elements/form_connection/form_methods/method/JsonBody";
import XmlBody from "@change_component/form_elements/form_connection/form_methods/method/XmlBody";
import Enhancement from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement";

class Body extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isBodyVisible: false,
            enhancementComponent: null,
            enhancementData: null,
        }
    }

    setEnhancement(enhancementData){
        this.setState({
            enhancementData,
        });
    }

    toggleBodyVisible(){
        this.setState({
            isBodyVisible: !this.state.isBodyVisible,
            enhancementData: null,
        });
    }

    renderBody(){
        const {readOnly, method, connection, updateEntity, isDraft} = this.props;
        const connector = connection.getConnectorByMethodIndex(method);
        switch(method.bodyFormat){
            case BODY_FORMAT.JSON:
                return (
                    <JsonBody
                        id={'description_body'}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={method}
                        connection={connection}
                        connector={connector}
                        updateEntity={updateEntity}
                        noPlaceholder={true}
                        setEnhancementData={::this.setEnhancement}
                    />
                );
            case BODY_FORMAT.XML:
                return (
                    <XmlBody
                        id={'description_body'}
                        isDraft={isDraft}
                        readOnly={readOnly}
                        method={method}
                        connection={connection}
                        connector={connector}
                        updateEntity={updateEntity}
                        noPlaceholder={true}
                        setEnhancementData={::this.setEnhancement}
                    />
                );
        }
    }

    renderMapping(){

    }

    renderEnhancement(){
        const {enhancementData} = this.state;
        if(!enhancementData){
            return (
                <div className={styles.body_reference_not_selected_message}>
                    Please, click on the reference
                </div>
            );
        }
        return(
            <div className={styles.data}>
                <Enhancement
                    {...enhancementData}
                />
            </div>
        );
    }

    render(){
        const {isBodyVisible} = this.state;
        const {bodyTitle} = this.props;
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
                    theme={{dialog: styles.body_dialog, content: styles.body_content}}
                >
                    <div className={styles.body_data}>
                        <div><b>{bodyTitle}</b></div>
                        {this.renderBody()}
                    </div>
                    <div className={styles.body_enhancement}>
                        <div><b>{'Enhancement'}</b></div>
                        {this.renderEnhancement()}
                    </div>
                </Dialog>
            </React.Fragment>
        );
    }
}

Body.defaultProps = {
    isDraft: false,
};

export default Body;