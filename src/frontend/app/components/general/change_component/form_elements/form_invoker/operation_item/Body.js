/*
 * Copyright (C) <2020>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import Input from '@basic_components/inputs/Input';

import theme from "react-toolbox/lib/input/theme.css";
import styles from '@themes/default/general/change_component.scss';
import {isString, isJsonString, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import FontIcon from "@basic_components/FontIcon";
import Dialog from "@basic_components/Dialog";

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
                actions={[{label: 'Ok', onClick: ::this.importJson}, {label: 'Cancel', onClick: ::this.toggleImportJson}]}
                active={showImportJson}
                onEscKeyDown={::this.toggleImportJson}
                onOverlayClick={::this.toggleImportJson}
                title={'Type Json'}
            >
                <Input
                    id={'dialog_import_json'}
                    className={styles.input_textarea_import_json}
                    name={'json'}
                    type={'text'}
                    onChange={::this.setImportJson}
                    value={importJson}
                    label={'json'}
                    multiline
                    rows={7}
                />
            </Dialog>
        );
    }

    renderLabel(){
        const {focused} = this.state;
        let labelStyle = theme.label;
        let label = 'Body';
        if(focused){
            labelStyle += ' ' + styles.multiselect_focused;
        }
        return <label className={labelStyle} style={{top: '15px'}}>{label}</label>;
    }

    render(){
        const {icon, readOnly} = this.props.data;
        let {tourStep, entity, forConnection, hasHeightLimits} = this.props;
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
            <div className={`${forConnection || noIcon ? '' : theme.withIcon} ${theme.input}`} style={{paddingBottom: 0}}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <ReactJson
                    name={'body'}
                    collapsed={false}
                    src={value}
                    onSelect={::this.onSelectValue}
                    onEdit={readOnly ? false : ::this.handleInput}
                    onDelete={readOnly ? false : ::this.handleInput}
                    onAdd={readOnly ? false : ::this.handleInput}
                    style={reactJsonStyle}
                />
                {!readOnly
                    ?
                        <TooltipFontIcon
                            className={`${styles.input_import_json_button} ${tourStep ? tourStep : ''}`}
                            value={'keyboard'}
                            onClick={::this.toggleImportJson}
                            tooltip={'Type the whole JSON'}
                        />
                    :
                        null
                }
                {!readOnly ? this.renderDialogImportJson() : null}

                {!noIcon ? <FontIcon value={icon} className={theme.icon}/> : null}
                <span className={theme.bar}/>
                {this.renderLabel()}
            </div>
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