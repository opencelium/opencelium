import React from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import Table from "@basic_components/table/Table";
import styles from "@themes/default/content/update_assistant/main";
import Button from "@basic_components/buttons/Button";
import {updateTemplates, updateTemplatesRejected} from "@actions/update_assistant/update";
import {addConvertTemplatesLogs} from "@actions/update_assistant/add";
import {fetchTemplates} from "@actions/templates/fetch";
import {ListComponent} from "@decorators/ListComponent";
import TemplateFileEntry from "@components/content/update_assistant/file_update/TemplateFileEntry";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const templates = state.get('templates');
    const updateAssistant = state.get('update_assistant');
    return {
        authUser: auth.get('authUser'),
        appVersion: app.get('appVersion'),
        fetchingTemplates: templates.get('fetchingTemplates'),
        templates: templates.get('templates').toJS(),
        updatingTemplates: updateAssistant.get('updatingTemplates'),
        addingTemplatesLogs: updateAssistant.get('addingTemplatesLogs'),
    }
}

@connect(mapStateToProps, {fetchTemplates, updateTemplates, updateTemplatesRejected, addConvertTemplatesLogs})
@withTranslation('update_assistant')
@ListComponent('templates')
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

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {templates, updateTemplates, addConvertTemplatesLogs} = this.props;
        if(templates.length > index){
            this.setState({
                currentTemplateIndex: index,
            });
        } else{
            const {convertedTemplates} = this.state;
            const templatesWithErrors = convertedTemplates.filter(template => template.status !== null);
            const isFinishUpdate = templatesWithErrors.length === 0;
            const {entity, updateEntity} = this.props;
            entity.templateFileUpdate = {...entity.templateFileUpdate, updatedTemplates: convertedTemplates, isFinishUpdate};
            updateEntity(entity);
            this.setState({
                currentTemplateIndex: -1,
            });
            if(isFinishUpdate) {
                updateTemplates(convertedTemplates);
            } else{
                addConvertTemplatesLogs(templatesWithErrors.map(template => {return {templateId: template.data.templateId, templateName: template.data.name, message: template.status.error.message, data: template.status.error.data};}));
            }
        }
    }

    updateTemplates(){
        this.setState({
            convertedTemplates: [],
        }, () => ::this.convert(0));
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
        return(
            <div style={{margin: '20px 68px 0px 0px'}}>
                <Table className={styles.table} authUser={authUser}>
                    <thead>
                        <tr>
                            <th>{`v${appVersion}`}</th>
                            <th style={{paddingRight: templates.length > 6 ? '35px' : ''}}>{`v${entity.availableUpdates.selectedVersion}`}</th>
                        </tr>
                    </thead>
                </Table>
                <div className={styles.table_content}>
                    <Table authUser={authUser}>
                        <tbody>
                            {templates.map((template, key) => (
                                <TemplateFileEntry
                                    key={template.templateId}
                                    index={key}
                                    template={template}
                                    setTemplate={::this.setTemplate}
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
                        onClick={::this.updateTemplates}
                        className={styles.update_button}
                    />
                }
                {currentTemplateIndex !== -1 && <TooltipFontIcon isButton={true} tooltip={t('FORM.CANCEL_TOOLTIP')} value={'cancel'} iconClassName={'material-icons-outlined'} className={styles.cancel_icon} onClick={::this.cancelConvert}/>}
            </div>
        );
    }
}

export default TemplateFileUpdate;