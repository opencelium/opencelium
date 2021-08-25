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
import {API_REQUEST_STATE} from "@utils/constants/app";


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

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.invokers.length === 0 && !this.props.entity.invokerFileUpdate.isFinishUpdate && this.props.fetchingInvokers === API_REQUEST_STATE.FINISH){
            const {entity, updateEntity} = this.props;
            entity.invokerFileUpdate = {...entity.invokerFileUpdate, isFinishUpdate: true};
            updateEntity(entity);
        }
    }

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {invokers, addConvertInvokersLogs, updateInvokers, openNextForm} = this.props;
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
                openNextForm();
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
                        <th>{`${appVersion}`}</th>
                        <th style={{paddingRight: invokers.length > 6 ? '35px' : ''}}>{entity.availableUpdates.selectedVersion ? `${entity.availableUpdates.selectedVersion.name}` : ''}</th>
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