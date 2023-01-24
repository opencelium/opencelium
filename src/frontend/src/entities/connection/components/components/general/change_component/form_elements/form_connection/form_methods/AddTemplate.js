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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import Input from "@entity/connection/components/components/general/basic_components/inputs/Input";
import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import {setFocusById} from "@application/utils/utils";
import {withTranslation} from "react-i18next";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";


function mapStateToProps(state){
    const appVersion = state.applicationReducer.version;
    return{
        appVersion,
    };
}

/**
 * Add Template Component
 */
@connect(mapStateToProps, {})
@withTranslation(['templates'])
class AddTemplate extends Component{

    constructor(props){
        super(props);
        this.state = {
            visibleAddTemplateDialog: false,
            addTemplateName: props.name || '',
            addTemplateDescription: props.description || '',
            validateMessageName: '',
        };
    }

    /**
     * to change template name
     */
    changeAddTemplateName(addTemplateName){
        this.setState({addTemplateName, validateMessageName: ''});
    }

    /**
     * to change template template
     */
    changeAddTemplateDescription(addTemplateDescription){
        this.setState({addTemplateDescription});
    }

    /**
     * to show/hide template dialog
     */
    toggleAddTemplateDialog(){
        this.setState({
            visibleAddTemplateDialog: !this.state.visibleAddTemplateDialog,
        });
    }

    /**
     * to validate fields
     */
    validateFields(){
        const {t} = this.props;
        const {addTemplateName} = this.state;
        let validateMessageName = '';
        if(addTemplateName.trim() === ''){
            validateMessageName = t(`ADD.VALIDATION_MESSAGES.NAME_REQUIRED`);
            setFocusById('template_name');
        }
        this.setState({
            validateMessageName,
        });
        return validateMessageName === '';
    }

    /**
     * to add template
     */
    addTemplate(){
        if(this.validateFields()){
            const {addTemplateName, addTemplateDescription} = this.state;
            const {data, entity, appVersion} = this.props;
            const {actions} = data;
            if(actions && actions.hasOwnProperty('addTemplate')){
                actions.addTemplate({name: addTemplateName, description: addTemplateDescription, entity, version: appVersion});
            }
            this.toggleAddTemplateDialog();
        }
    }

    render(){
        const {visibleAddTemplateDialog, addTemplateName, addTemplateDescription, validateMessageName} = this.state;
        const {data, disabled, iconProps, buttonProps} = this.props;
        const {templateLabels} = data;
        if(!templateLabels){
            return null;
        }
        return (
            <React.Fragment>
                {iconProps && <TooltipFontIcon {...iconProps} turquoiseTheme isButton onClick={(a) => this.toggleAddTemplateDialog(a)} disabled={disabled}/>}
                {buttonProps && <Button {...buttonProps} onClick={(a) => this.toggleAddTemplateDialog(a)} disabled={disabled}/>}
                <Dialog
                    actions={[{label: 'Ok', onClick: (a) => this.addTemplate(a), id: 'add_template_ok'}, {label: 'Cancel', onClick: (a) => this.toggleAddTemplateDialog(a), id: 'add_template_cancel'}]}
                    active={visibleAddTemplateDialog}
                    toggle={(a) => this.toggleAddTemplateDialog(a)}
                    title={templateLabels.addTemplateTitle}
                    theme={{title: styles.template_dialog_title}}
                >
                    <div>
                        <InputText
                            id={'template_name'}
                            error={validateMessageName}
                            onChange={(e) => this.changeAddTemplateName(e.target.value)}
                            value={addTemplateName}
                            label={'Name'}
                            name={'template_name'}
                            icon={'title'}
                            autoFocus
                            required
                        />
                        <InputTextarea
                            id={'template_description'}
                            onChange={(e) => this.changeAddTemplateDescription(e.target.value)}
                            value={addTemplateDescription}
                            label={'Description'}
                            name={'template_description'}
                            icon={'notes'}
                        />
                    </div>
                </Dialog>
            </React.Fragment>
        );
    }
}

AddTemplate.propTypes = {
    data: PropTypes.object.isRequired,
    entity: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
    name: PropTypes.string,
    description: PropTypes.string,
};

AddTemplate.defaultProps = {
    disabled: false,
    buttonProps: null,
    iconProps: null,
    name: '',
    description: '',
}

export default AddTemplate;