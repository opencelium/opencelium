import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import {isJsonString, isString} from "../../../../../../../utils/app";
import TooltipFontIcon from "../../../../../basic_components/tooltips/TooltipFontIcon";
import ParamGenerator from "./ParamGenerator";
import Input from "../../../../../basic_components/inputs/Input";
import Dialog from "../../../../../basic_components/Dialog";

import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../../../../themes/default/general/form_methods.scss';
import CMethodItem from "../../../../../../../classes/components/content/connection/method/CMethodItem";
import CConnectorItem from "../../../../../../../classes/components/content/connection/CConnectorItem";
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";

class Body extends Component{

    constructor(props){
        super(props);
        this.paramGenerator = React.createRef();

        this.state = {
            showImportJson: false,
            isBodyEditOpened: false,
            importJsonBody: {},
        };
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
        return(
            <React.Fragment>
                <br/>
                <span className={styles.method_body_placeholder} onClick={::this.openBodyEdit}>{`{ ... }`}</span>
            </React.Fragment>
        );
    }

    renderCloseMenuEditButton(){
        return (
            <TooltipFontIcon
                className={styles.operator_close_menu_edit}
                value={'check_circle_outline'}
                tooltip={'Apply'}
                onClick={::this.closeBodyEdit}
            />
        );
    }

    render(){
        const {isBodyEditOpened} = this.state;
        const {id, readOnly, method, connector, connection, updateBody, setCurrentItem} = this.props;
        if(!isBodyEditOpened){
            return this.renderPlaceholder();
        }
        return(
            <div className={`${theme.input} ${styles.method_body}`}>
                {::this.renderCloseMenuEditButton()}
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <div style={{display: 'none'}} id={`${id}_reference_component`}/>
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
    method: PropTypes.instanceOf(CMethodItem).isRequired,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    updateBody: PropTypes.func.isRequired,
    setCurrentItem: PropTypes.func.isRequired,
};

Body.defaultProps = {
    readOnly: false,
};

export default Body;