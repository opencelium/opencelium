import React from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import Table from "@basic_components/table/Table";
import styles from "@themes/default/content/update_assistant/main";
import Button from "@basic_components/buttons/Button";
import {updateInvokers, updateInvokersRejected} from "@actions/update_assistant/update";
import {addConvertInvokersLogs} from "@actions/update_assistant/add";
import {fetchInvokers, fetchDefaultInvokers} from "@actions/invokers/fetch";
import {ListComponent} from "@decorators/ListComponent";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import InvokerFileEntry from "@components/content/update_assistant/file_update/InvokerFileEntry";


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const invokers = state.get('invokers');
    const updateAssistant = state.get('update_assistant');
    return {
        authUser: auth.get('authUser'),
        appVersion: app.get('appVersion'),
        fetchingInvokers: invokers.get('fetchingInvokers'),
        invokers: invokers.get('invokers').toJS(),
        fetchingDefaultInvokers: invokers.get('fetchingDefaultInvokers'),
        defaultInvokers: invokers.get('defaultInvokers').toJS(),
        updatingInvokers: updateAssistant.get('updatingInvokers'),
        addingInvokersLogs: updateAssistant.get('addingInvokersLogs'),
    }
}

@connect(mapStateToProps, {fetchInvokers, fetchDefaultInvokers, updateInvokers, updateInvokersRejected, addConvertInvokersLogs})
@withTranslation('update_assistant')
@ListComponent('invokers')
@ListComponent('defaultInvokers')
class InvokerFileUpdate extends React.Component{
    constructor(props) {
        super(props);
        const {entity} = props;
        this.state = {
            currentInvokerIndex: -1,
            convertedInvokers: entity.invokerFileUpdate.updatedInvokers,
            isCanceledConvert: false,
        }
    }

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {invokers, addConvertInvokersLogs, updateInvokers} = this.props;
        if(invokers.length > index){
            this.setState({
                currentInvokerIndex: index,
            });
        } else{
            const {convertedInvokers} = this.state;
            const invokersWithErrors = convertedInvokers.filter(invoker => invoker.status.error !== null);
            const isFinishUpdate = invokersWithErrors.length === 0;
            const {entity, updateEntity} = this.props;
            entity.invokerFileUpdate = {...entity.invokerFileUpdate, updatedInvokers: convertedInvokers, isFinishUpdate};
            updateEntity(entity);
            this.setState({
                currentInvokerIndex: -1,
            });
            if(isFinishUpdate) {
                if(convertedInvokers.length > 0) {
                    updateInvokers(convertedInvokers.map(invoker => {return {xml: invoker.data};}));
                }
            } else{
                addConvertInvokersLogs(invokersWithErrors.map(invoker => {return {invokerName: invoker.data.name, message: invoker.status.error.message, data: invoker.status.error.data};}));
            }
        }
    }

    updateInvokers(){
        this.setState({
            convertedInvokers: [],
        }, () => ::this.convert(0));
    }

    setInvoker(invoker, status, index){
        this.setState({
            convertedInvokers: [...this.state.convertedInvokers, {data: invoker, status}]
        }, () => {
            if (!this.state.isCanceledConvert) {
                this.convert(index + 1)
            } else {
                this.setState({
                    convertedInvokers: [],
                    currentInvokerIndex: -1,
                    isCanceledConvert: false,
                })
            }
        });
    }

    render(){
        const {currentInvokerIndex, convertedInvokers} = this.state;
        const {t, authUser, invokers, defaultInvokers, appVersion, entity} = this.props;
        if(invokers.length === 0){
            return(
                <div>
                    {t('FORM.NO_INVOKERS')}
                </div>
            )
        }
        return(
            <div style={{margin: '20px 68px 0px 0px'}}>
                <Table className={styles.table} authUser={authUser}>
                    <thead>
                    <tr>
                        <th>{`v${appVersion}`}</th>
                        <th style={{paddingRight: invokers.length > 6 ? '35px' : ''}}>{`v${entity.availableUpdates.selectedVersion}`}</th>
                    </tr>
                    </thead>
                </Table>
                <div className={styles.table_content}>
                    <Table authUser={authUser}>
                        <tbody>
                        {invokers.map((invoker, key) => (
                            <InvokerFileEntry
                                key={invoker.name}
                                index={key}
                                invoker={invoker}
                                setInvoker={::this.setInvoker}
                                isConverting={currentInvokerIndex === key}
                                convertedInvokers={convertedInvokers}
                                entity={entity}
                                defaultInvokers={defaultInvokers}
                            />
                        ))}
                        </tbody>
                    </Table>
                </div>
                {currentInvokerIndex === -1 &&
                <Button
                    authUser={authUser}
                    title={t('FORM.UPDATE_BUTTON')}
                    onClick={::this.updateInvokers}
                    className={styles.update_button}
                />
                }
                {currentInvokerIndex !== -1 && <TooltipFontIcon isButton={true} tooltip={t('FORM.CANCEL_TOOLTIP')} value={'cancel'} iconClassName={'material-icons-outlined'} className={styles.cancel_icon} onClick={::this.cancelConvert}/>}
            </div>
        );
    }
}

export default InvokerFileUpdate;