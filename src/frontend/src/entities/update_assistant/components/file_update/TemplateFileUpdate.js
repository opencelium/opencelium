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

import React from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import Table from "@basic_components/table/Table";
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import Button from "@basic_components/buttons/Button";
import {getAllTemplates as fetchTemplates} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {ListComponent} from "@entity/connection/components/decorators/ListComponent";
import TemplateFileEntry from "@entity/update_assistant/components/file_update/TemplateFileEntry";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const application = state.applicationReducer;
    const template = state.templateReducer;
    return {
        authUser,
        appVersion: application.version,
        fetchingTemplates: template.gettingTemplates,
        templates: template.templates,
    }
}

@connect(mapStateToProps, {fetchTemplates})
@withTranslation('update_assistant')
@ListComponent('templates', true)
class TemplateFileUpdate extends React.Component{
    constructor(props) {
        super(props);
        const {entity} = props;
        this.state = {
            currentTemplateIndex: -1,
            convertedTemplates: entity.templateFileUpdate.updatedTemplates,
            isCanceledConvert: false,
        }
    }

    componentDidMount() {
        if(this.props.templates.length === 0){
            this.props.openNextForm();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.templates.length === 0 && !this.props.entity.templateFileUpdate.isFinishUpdate && this.props.fetchingTemplates === API_REQUEST_STATE.FINISH){
            const {entity, updateEntity} = this.props;
            let newEntity = {...entity};
            newEntity.templateFileUpdate = {...entity.templateFileUpdate, isFinishUpdate: true};
            updateEntity(newEntity);
        }
    }

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {templates, openNextForm} = this.props;
        if(templates.length > index){
            this.setState({
                currentTemplateIndex: index,
            });
        } else{
            const {convertedTemplates} = this.state;
            const templatesWithErrors = convertedTemplates.filter(template => template.status !== null);
            const isFinishUpdate = templatesWithErrors.length === 0;
            const {entity, updateEntity} = this.props;
            let newEntity = {...entity};
            newEntity.templateFileUpdate = {...entity.templateFileUpdate, updatedTemplates: convertedTemplates, isFinishUpdate};
            updateEntity(newEntity);
            this.setState({
                currentTemplateIndex: -1,
            });
            if(isFinishUpdate) {
                openNextForm();
            }
        }
    }

    updateTemplates(){
        this.setState({
            convertedTemplates: [],
        }, () => this.convert(0));
    }

    setTemplate(template, status, index){
        this.setState({
            convertedTemplates: [...this.state.convertedTemplates, {data: template, status}]
        }, () => {
            if(!this.state.isCanceledConvert) {
                this.convert(index + 1)
            } else{
                this.setState({
                    convertedTemplates: [],
                    currentTemplateIndex: -1,
                    isCanceledConvert: false,
                })
            }
        });
    }

    render(){
        const {currentTemplateIndex, convertedTemplates} = this.state;
        const {t, authUser, templates, appVersion, entity} = this.props;
        if(templates.length === 0){
            return(
                <div>
                    {t('FORM.NO_TEMPLATES')}
                </div>
            )
        }
        return(
            <div style={{margin: '20px 68px 0px 0px'}}>
                <Table className={styles.table} authUser={authUser}>
                    <thead>
                        <tr>
                            <th>{`${appVersion}`}</th>
                            <th style={{paddingRight: templates.length > 6 ? '35px' : ''}}>{entity.availableUpdates.selectedVersion ? `${entity.availableUpdates.selectedVersion.name}` : ''}</th>
                        </tr>
                    </thead>
                </Table>
                <div className={styles.table_content}>
                    <Table authUser={authUser}>
                        <tbody>
                            {templates.map((template, key) => (
                                <TemplateFileEntry
                                    key={`${template.templateId}_${key}`}
                                    index={key}
                                    template={template}
                                    setTemplate={(a, b, c) => this.setTemplate(a, b, c)}
                                    isConverting={currentTemplateIndex === key}
                                    convertedTemplates={convertedTemplates}
                                    entity={entity}
                                />
                            ))}
                        </tbody>
                    </Table>
                </div>
                {currentTemplateIndex === -1 &&
                    <Button
                        authUser={authUser}
                        title={t('FORM.UPDATE_BUTTON')}
                        onClick={() => this.updateTemplates()}
                        float={'right'}
                        margin={'15px 0 40px'}
                    />
                }
                <TooltipFontIcon iconStyles={{opacity: currentTemplateIndex !== -1 ? '1.0' : '0'}} isButton={true} tooltip={t('FORM.CANCEL_TOOLTIP')} value={'cancel'} iconClassName={'material-icons-outlined'} className={styles.cancel_icon} onClick={() => this.cancelConvert()}/>
            </div>
        );
    }
}

export default TemplateFileUpdate;