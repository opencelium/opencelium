/*
 * Copyright (C) <2021>  <becon GmbH>
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
import {connect} from 'react-redux';

import Input from "@basic_components/inputs/Input";
import styles from '@themes/default/general/change_component.scss';
import Button from "@basic_components/buttons/Button";
import Dialog from "@basic_components/Dialog";


function mapStateToProps(state){
    const app = state.get('app');
    return{
        appVersion: app.get('appVersion'),
    };
}

/**
 * Add Template Component
 */
@connect(mapStateToProps, {})
class AddTemplate extends Component{

    constructor(props){
        super(props);
        this.state = {
            visibleAddTemplateDialog: false,
            addTemplateName: '',
            addTemplateDescription: '',
        };
    }

    /**
     * to change template name
     */
    changeAddTemplateName(addTemplateName){
        this.setState({addTemplateName});
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
     * to add template
     */
    addTemplate(){
        const {addTemplateName, addTemplateDescription} = this.state;
        const {data, entity, appVersion} = this.props;
        const {actions} = data;
        if(actions && actions.hasOwnProperty('addTemplate')){
            actions.addTemplate({name: addTemplateName, description: addTemplateDescription, entity, version: appVersion});
        }
        this.toggleAddTemplateDialog();
    }

    render(){
        const {visibleAddTemplateDialog, addTemplateName, addTemplateDescription} = this.state;
        const {data, disabled} = this.props;
        const {templateLabels} = data;
        if(!templateLabels){
            return null;
        }
        return (
            <div style={{float: 'left', marginRight: '20px'}}>
                <Button icon={'add'} title={templateLabels.addTemplate} onClick={::this.toggleAddTemplateDialog} disabled={disabled}/>
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.addTemplate, id: 'add_template_ok'}, {label: 'Cancel', onClick: ::this.toggleAddTemplateDialog, id: 'add_template_cancel'}]}
                    active={visibleAddTemplateDialog}
                    toggle={::this.toggleAddTemplateDialog}
                    title={templateLabels.addTemplateTitle}
                    theme={{title: styles.template_dialog_title}}
                >
                    <div>
                        <Input
                            onChange={::this.changeAddTemplateName}
                            value={addTemplateName}
                            label={'Name'}
                            name={'template_name'}
                            icon={'title'}
                            autoFocus
                        />
                        <Input
                            onChange={::this.changeAddTemplateDescription}
                            value={addTemplateDescription}
                            label={'Description'}
                            name={'template_description'}
                            icon={'notes'}
                            multiline={true}
                            rows={4}
                        />
                    </div>
                </Dialog>
            </div>
        );
    }
}

AddTemplate.propTypes = {
    data: PropTypes.object.isRequired,
    entity: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
};

AddTemplate.defaultProps = {
    disabled: false,
}

export default AddTemplate;