/*
 * Copyright (C) <2019>  <becon GmbH>
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

import Input from "../../../../basic_components/inputs/Input";
import styles from '../../../../../../themes/default/general/change_component.scss';
import Button from "../../../../basic_components/buttons/Button";
import Dialog from "../../../../basic_components/Dialog";


/**
 * Add Template Component
 */
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
        const {data, entity} = this.props;
        const {actions} = data;
        if(actions && actions.hasOwnProperty('addTemplate')){
            actions.addTemplate({name: addTemplateName, description: addTemplateDescription, entity});
        }
        this.toggleAddTemplateDialog();
    }

    render(){
        const {visibleAddTemplateDialog, addTemplateName, addTemplateDescription} = this.state;
        const {data, authUser} = this.props;
        const {templateLabels} = data;
        if(!templateLabels){
            return null;
        }
        return (
            <div style={{textAlign: 'right'}}>
                <Button authUser={authUser} title={templateLabels.addTemplate} onClick={::this.toggleAddTemplateDialog}/>
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.addTemplate}, {label: 'Cancel', onClick: ::this.toggleAddTemplateDialog}]}
                    active={visibleAddTemplateDialog}
                    onEscKeyDown={::this.toggleAddTemplateDialog}
                    onOverlayClick={::this.toggleAddTemplateDialog}
                    title={templateLabels.addTemplateTitle}
                    theme={{title: styles.template_dialog_title}}
                >
                    <div>
                        <Input
                            onChange={::this.changeAddTemplateName}
                            value={addTemplateName}
                            label={'Name'}
                            name={'template_name'}
                            icon={'text_fields'}
                            autoFocus
                        />
                        <Input
                            onChange={::this.changeAddTemplateDescription}
                            value={addTemplateDescription}
                            label={'Description'}
                            name={'template_description'}
                            icon={'short_text'}
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
    authUser: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    entity: PropTypes.object.isRequired,
};

export default AddTemplate;