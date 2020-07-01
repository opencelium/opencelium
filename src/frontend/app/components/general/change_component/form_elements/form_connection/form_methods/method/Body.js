import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import {isArray, isJsonString, isString, setFocusById, subArrayToString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import ParamGenerator from "./ParamGenerator";
import Input from "@basic_components/inputs/Input";
import Dialog from "@basic_components/Dialog";

import theme from "react-toolbox/lib/input/theme.css";
import styles from '@themes/default/general/form_methods.scss';
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import CConnectorItem, {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";
import Enhancement from "../mapping/enhancement/Enhancement";

class Body extends Component{

    constructor(props){
        super(props);
        this.paramGenerator = React.createRef();

        this.state = {
            showImportJson: false,
            isBodyEditOpened: false,
            importJsonBody: {},
            showEnhancement: false,
            currentEnhancement: null,
        };
    }

    toggleEnhancement(){
        this.setState({
            showEnhancement: !this.state.showEnhancement,
        });
    }

    openBodyEdit(){
        this.setState({isBodyEditOpened: true});
    }

    closeBodyEdit(){
        this.setState({isBodyEditOpened: false});
    }

    /**
     * to show/hide import json
     */
    toggleImportJson(){
        this.setState({showImportJson: !this.state.showImportJson});
    }

    /**
     * to set import json value
     */
    onChangeImportJsonBody(importJsonBody){
        this.setState({
            importJsonBody,
        });
    }

    /**
     * to import json
     */
    importJson(){
        let {importJsonBody} = this.state;
        const {updateBody} = this.props;
        if(isJsonString(importJsonBody)) {
            updateBody({updated_src: JSON.parse(importJsonBody)});
            this.toggleImportJson();
        } else{
            alert('Not JSON format');
        }
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

    /*
    * to open an enhancement when click on pointer
     */
    openEnhancement(e, value){
        const {connector} = this.props;
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
            this.props.connection.setCurrentFieldBindingTo(bindingItem);
        }
        this.setState({
            currentEnhancement: this.props.connection.getEnhancementByTo(),
            showEnhancement: !this.state.showEnhancement,
        });
    }

    setCurrentEnhancement(currentEnhancement){
        this.setState({
            currentEnhancement,
        });
    }

    /**
     * to update enhancement in entity
     */
    updateEnhancement(){
        const {currentEnhancement} = this.state;
        const {connection, updateEntity} = this.props;
        connection.updateEnhancement(currentEnhancement);
        updateEntity();
        this.toggleEnhancement();
    }

    renderEnhancement(){
        const {showEnhancement, currentEnhancement} = this.state;
        const {readOnly, connection, method} = this.props;
        if(!(connection instanceof CConnection)){
            return null;
        }
        let bindingItem = connection.fieldBinding.find(item => item.to.findIndex(elem => elem.color === method.color) !== -1);
        if(!bindingItem){
            return null;
        }
        bindingItem = bindingItem.getObject();
        bindingItem.enhancement = null;
        return (
            <Dialog
                actions={[{label: 'Ok', onClick: ::this.updateEnhancement, id: 'body_ok'}, {label: 'Cancel', onClick: ::this.toggleEnhancement, id: 'body_cancel'}]}
                active={showEnhancement}
                onEscKeyDown={::this.toggleEnhancement}
                onOverlayClick={::this.toggleEnhancement}
                title={'Enhancement'}
                className={styles.enhancement_dialog}
                theme={{title: styles.enhancement_dialog_title}}
            >
                <div>
                    <Enhancement
                        binding={bindingItem}
                        setEnhancement={::this.setCurrentEnhancement}
                        readOnly={readOnly}
                        enhancement={currentEnhancement}
                    />
                </div>
            </Dialog>
        );
    }

    renderDialogImportJson(){
        let {showImportJson, importJsonBody} = this.state;
        importJsonBody = !isString(importJsonBody) ? JSON.stringify(importJsonBody) : importJsonBody;
        return (
            <Dialog
                actions={[{label: 'Ok', onClick: ::this.importJson}, {label: 'Cancel', onClick: ::this.toggleImportJson}]}
                active={showImportJson}
                onEscKeyDown={::this.toggleImportJson}
                onOverlayClick={::this.toggleImportJson}
                title={'Import Json'}
            >
                <Input
                    className={styles.textarea_import_json}
                    name={'json'}
                    type={'text'}
                    onChange={::this.onChangeImportJsonBody}
                    value={importJsonBody}
                    label={'json'}
                    multiline
                    rows={7}
                />
            </Dialog>
        );
    }

    renderPlaceholder(){
        const {method} = this.props;
        let hasError = false;
        if(method.error && method.error.hasError){
            if(method.error.location === 'body'){
                hasError = true;
            }
        }
        return(
            <React.Fragment>
                <span className={styles.method_body_placeholder}
                      title={'more details'}
                      style={hasError ? {color: 'red'} : {}}
                      onClick={::this.openBodyEdit}>{`{ ... }`}</span>
            </React.Fragment>
        );
    }

    renderCloseMenuEditButton(){
        return (
            <TooltipFontIcon
                className={styles.body_close_menu_edit}
                value={'check_circle_outline'}
                tooltip={'Apply'}
                onClick={::this.closeBodyEdit}
            />
        );
    }

    render(){
        const {isBodyEditOpened} = this.state;
        const {id, readOnly, method, connector, connection, updateBody, setCurrentItem, bodyStyles} = this.props;
        if(!isBodyEditOpened){
            return this.renderPlaceholder();
        }
        let ownBodyStyles = {left: '-20px'};
        if(bodyStyles){
            ownBodyStyles = bodyStyles;
        }
        return(
            <div className={`${theme.input} ${styles.method_body}`} style={ownBodyStyles}>
                {::this.renderCloseMenuEditButton()}
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <div style={{display: 'none'}} id={`${id}_reference_component`}/>
                {this.renderEnhancement()}
                <ReactJson
                    name={false}
                    collapsed={false}
                    src={method.request.body}
                    onEdit={readOnly ? false : updateBody}
                    onDelete={readOnly ? false : updateBody}
                    onAdd={readOnly ? false : updateBody}
                    onSelect={setCurrentItem}
                    style={{wordBreak: 'break-word', padding: '8px 0', width: '80%', display: 'inline-block', position: 'relative'}}
                    ReferenceComponent={{
                        component: <ParamGenerator
                            ref={this.paramGenerator}
                            connection={connection}
                            connector={connector}
                            method={method}
                            readOnly={readOnly}
                            addParam={updateBody}
                            isVisible={true}
                            id={`${id}_reference_component`}
                        />,
                        id: `${id}_reference_component`,
                        self: this.paramGenerator,
                    }}
                    onReferenceClick={::this.openEnhancement}
                />
                {
                    !readOnly
                        ?
                        <TooltipFontIcon
                            style={{ cursor: 'pointer'}}
                            className={`${styles.input_import_json_button}`}
                            value={'keyboard'}
                            onClick={::this.toggleImportJson}
                            tooltip={'Type the whole JSON'}
                        />
                        :
                        null}
                {!readOnly ? this.renderDialogImportJson() : null}
                <span className={theme.bar}/>
            </div>
        );
    }
}

Body.propTypes = {
    id: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    connection: PropTypes.instanceOf(CConnection),
    connector: PropTypes.instanceOf(CConnectorItem),
    updateBody: PropTypes.func,
    setCurrentItem: PropTypes.func,
};

Body.defaultProps = {
    readOnly: false,
    bodyStyles: {},
};

export default Body;