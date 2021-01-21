import React from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import Table from "@basic_components/table/Table";
import styles from "@themes/default/content/update_assistant/main";
import Button from "@basic_components/buttons/Button";
import {updateTemplates, updateTemplatesRejected} from "@actions/update_assistant/update";
import {fetchTemplates} from "@actions/templates/fetch";
import {ListComponent} from "@decorators/ListComponent";
import FileEntry from "@components/content/update_assistant/FileEntry";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const templates = state.get('templates');
    return {
        authUser: auth.get('authUser'),
        appVersion: app.get('appVersion'),
        fetchingTemplates: templates.get('fetchingTemplates'),
        templates: templates.get('templates').toJS(),
    }
}

@connect(mapStateToProps, {fetchTemplates, updateTemplates, updateTemplatesRejected})
@withTranslation('update_assistant')
@ListComponent('templates')
class TemplateFileUpdate extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            currentTemplateIndex: -1,
            convertedTemplates: [],
            isCanceledConvert: false,
        }
    }

    componentWillUnmount(){
        const {entity, updateEntity} = this.props;
        entity.availableUpdates = {isFinishUpdate: false, updatedTemplates: [],};
        updateEntity(entity);
    }

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {templates} = this.props;
        if(templates.length > index){
            this.setState({
                currentTemplateIndex: index,
            });
        } else{
            const {convertedTemplates} = this.state;
            let isFinishUpdate = convertedTemplates.filter(template => template.status === null).length === 0;
            const {entity, updateEntity} = this.props;
            entity.templateFileUpdate = {...entity.templateFileUpdate, updatedTemplates: convertedTemplates, isFinishUpdate};
            updateEntity(entity);
            this.setState({
                currentTemplateIndex: -1,
            });
        }
    }

    updateTemplates(){
        const {updateTemplates} = this.props;
        this.setState({
            convertedTemplates: [],
        }, () => ::this.convert(0));
        //updateTemplates(convertedTemplates);
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
        const {t, authUser, templates} = this.props;
        return(
            <div style={{margin: '20px 68px 0px 0px'}}>
                <Table className={styles.table} authUser={authUser}>
                    <thead>
                        <tr>
                            <th>{'v1.2'}</th>
                            <th style={{paddingRight: templates.length > 6 ? '35px' : ''}}>{'v1.3'}</th>
                        </tr>
                    </thead>
                </Table>
                <div className={styles.table_content}>
                    <Table authUser={authUser}>
                        <tbody>
                            {templates.map((template, key) => (
                                <FileEntry
                                    key={template.templateId}
                                    index={key}
                                    template={template}
                                    setTemplate={::this.setTemplate}
                                    isConverting={currentTemplateIndex === key}
                                    convertedTemplates={convertedTemplates}
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
                {currentTemplateIndex !== -1 && <TooltipFontIcon isButton={true} tooltip={'Cancel'} value={'cancel'} iconClassName={'material-icons-outlined'} className={styles.cancel_icon} onClick={::this.cancelConvert}/>}
            </div>
        );
    }
}

export default TemplateFileUpdate;