import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Dialog from "@basic_components/Dialog";
import {BODY_FORMAT} from "@classes/components/content/invoker/CBody";
import JsonBody from "@change_component/form_elements/form_connection/form_methods/method/JsonBody";
import XmlBody from "@change_component/form_elements/form_connection/form_methods/method/XmlBody";
import Enhancement from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";
import {subArrayToString} from "@utils/app";
import CEnhancement from "@classes/components/content/connection/field_binding/CEnhancement";

class Body extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isBodyVisible: false,
            currentFieldName: '',
            currentEnhancement: null,
        }
    }

    toggleBodyVisible(){
        const {connection, updateConnection} = this.props;
        connection.currentEnhancemnet = null;
        updateConnection();
        this.setState({
            isBodyVisible: !this.state.isBodyVisible,
            currentEnhancement: null,
            currentFieldName: '',
        });
    }

    getCurrentBindingItem(fieldName){
        const {connection, method} = this.props;
        return connection.fieldBinding.find(item => {
            return item.to.findIndex(elem => {
                let name = elem.field.replace('[]', '');
                return elem.color === method.color && name === fieldName;
            }) !== -1;
        });
    }

    setCurrentEnhancementClickingOnPointer(e, value){
        const {connection, connector} = this.props;
        if(connector.getConnectorType() === CONNECTOR_FROM){
            return;
        }
        let fieldName = '';
        if(value.namespace.length > 1){
            fieldName = `${subArrayToString(value.namespace, '.', 1, value.namespace.length)}.`;
        }
        fieldName += value.variable.name;
        let bindingItem = this.getCurrentBindingItem(fieldName);
        if(bindingItem){
            bindingItem = bindingItem.to[0];
            connection.setCurrentFieldBindingTo(bindingItem);
        }
        this.setCurrentEnhancement(connection.getEnhancementByTo());
        this.setState({
            currentFieldName: fieldName,
        })
    }

    setCurrentEnhancement(currentEnhancement){
        const {connection} = this.props;
        if(currentEnhancement !== null) {
            connection.updateEnhancement(currentEnhancement);
        }
        this.setState({currentEnhancement: currentEnhancement instanceof CEnhancement ? currentEnhancement.getObject() : currentEnhancement});
    }

    updateEntity(){
        const {currentFieldName} = this.state;
        const {connection, updateConnection} = this.props;
        updateConnection();
        if(currentFieldName !== '') {
            let bindingItem = this.getCurrentBindingItem(currentFieldName);
            if (bindingItem) {
                bindingItem = bindingItem.to[0];
                connection.setCurrentFieldBindingTo(bindingItem);
            }
            this.setCurrentEnhancement(connection.getEnhancementByTo());
        }
    }

    renderBody(){
        const {readOnly, method, connection, isDraft, source, connector} = this.props;
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
                        updateEntity={::this.updateEntity}
                        noPlaceholder={true}
                        source={source}
                        openEnhancement={::this.setCurrentEnhancementClickingOnPointer}
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
                        updateEntity={::this.updateEntity}
                        noPlaceholder={true}
                        source={source}
                        openEnhancement={::this.setCurrentEnhancementClickingOnPointer}
                    />
                );
        }
    }

    renderEnhancement(){
        const {currentEnhancement} = this.state;
        const {readOnly} = this.props;
        if(!currentEnhancement){
            return (
                <div className={styles.body_reference_not_selected_message}>
                    Please, click on the reference
                </div>
            );
        }
        return(
            <div className={styles.data}>
                <Enhancement readOnly={readOnly} enhancement={{...currentEnhancement}} setEnhancement={::this.setCurrentEnhancement}/>
            </div>
        );
    }

    render(){
        const {isBodyVisible} = this.state;
        const {bodyTitle, connector} = this.props;
        const hasEnhancement = connector.getConnectorType() === CONNECTOR_TO;
        return(
            <React.Fragment>
                <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                <Col xs={8} className={`${styles.col}`}>
                    <TooltipFontIcon onClick={::this.toggleBodyVisible} size={14} value={<span className={styles.more_details}>{`...`}</span>} tooltip={'Body'}/>
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