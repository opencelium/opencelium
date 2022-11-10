/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import Input from '@entity/connection/components/components/general/basic_components/inputs/Input';

import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {isString, isJsonString, setFocusById} from "@application/utils/utils";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import ToolboxThemeInput from "../../../../../../hocs/ToolboxThemeInput";

/**
 * Component for Body in Invoker.RequestItem
 */
class Body extends Component{

    constructor(props){
        super(props);

        this.state = {
            showImportJson: false,
            importJson: JSON.stringify(props.entity.getBodyFields()),
            focused: false,
        };
    }

    componentDidUpdate(){
        if(this.state.showImportJson){
            setTimeout(() => setFocusById('dialog_import_json'), 301);
        }
    }

    onSelectValue(e){
        this.setState({focused: true});
    }

    handleInput(value){
        const {entity, updateEntity} = this.props;
        entity.setBodyFields(isString(value.updated_src) ? JSON.parse(value.updated_src) : value.updated_src);
        updateEntity();
    }

    /**
     * to set import json value
     */
    setImportJson(value){
        this.setState({
            importJson: value
        });
    }

    /**
     * to import json
     */
    importJson(){
        let {importJson} = this.state;
        if(isJsonString(importJson)) {
            //const referenceRegExp = /\"\#[0-9a-fA-F]{6}\.\((request|response)\)\..*\"/g;
            //importJson = JSON.parse(JSON.stringify(importJson).replace(referenceRegExp, '"\\"'));
            this.handleInput({updated_src: importJson});
            this.toggleImportJson();
        } else{
            alert('Not JSON format');
        }
    }
    /**
     * to show/hide import json
     */
    toggleImportJson(){
        this.setState({showImportJson: !this.state.showImportJson});
    }

    renderDialogImportJson(){
        const {showImportJson, importJson} = this.state;
        return (
            <Dialog
                actions={[{label: 'Ok', onClick: (a) => this.importJson(a)}, {label: 'Cancel', onClick: (a) => this.toggleImportJson(a)}]}
                active={showImportJson}
                toggle={(a) => this.toggleImportJson(a)}
                title={'Type Json'}
            >
                <Input
                    id={'dialog_import_json'}
                    className={styles.input_textarea_import_json}
                    name={'json'}
                    type={'text'}
                    onChange={(a) => this.setImportJson(a)}
                    value={importJson}
                    label={'json'}
                    multiline
                    rows={7}
                />
            </Dialog>
        );
    }

    render(){
        const {icon, readOnly} = this.props.data;
        let {tourStep, entity, hasHeightLimits} = this.props;
        let value = entity.getBodyFields();
        if(value === ''){
            value = {};
        }
        const noIcon = icon === '';
        let reactJsonStyle = {padding: '10px 0 0 0', width: '80%', display: 'inline-block'};
        if(hasHeightLimits){
            reactJsonStyle.maxHeight = '200px';
            reactJsonStyle.overflowY = 'auto';
            reactJsonStyle.width = '100%';
        }
        return (
            <ToolboxThemeInput
                style={{paddingBottom: 0}}
                icon={!noIcon ? icon : ''}
                label={'Body'}
            >
                <ReactJson
                    name={'body'}
                    collapsed={false}
                    src={value}
                    onSelect={(a) => this.onSelectValue(a)}
                    onEdit={readOnly ? false : (a) => this.handleInput(a)}
                    onDelete={readOnly ? false : (a) => this.handleInput(a)}
                    onAdd={readOnly ? false : (a) => this.handleInput(a)}
                    style={reactJsonStyle}
                />
                {!readOnly &&
                        <TooltipFontIcon
                            className={`${styles.input_import_json_button} ${tourStep ? tourStep : ''}`}
                            value={'keyboard'}
                            onClick={(a) => this.toggleImportJson(a)}
                            tooltip={'Type the whole JSON'}
                        />
                }
                {!readOnly && this.renderDialogImportJson()}
            </ToolboxThemeInput>
        );
    }
}

Body.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    updateEntity: PropTypes.func,
};

Body.defaultProps = {
    hasHeightLimits: false,
};


export default Body;