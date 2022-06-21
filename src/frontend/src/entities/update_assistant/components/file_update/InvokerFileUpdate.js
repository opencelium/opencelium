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
import {getAllInvokers as fetchInvokers} from "@entity/invoker/redux_toolkit/action_creators/InvokerCreators";
import {ListComponent} from "@entity/connection/components/decorators/ListComponent";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import InvokerFileEntry from "@entity/update_assistant/components/file_update/InvokerFileEntry";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const application = state.applicationReducer;
    const invoker = state.invokerReducer;
    return {
        authUser,
        appVersion: application.version,
        fetchingInvokers: invoker.gettingInvokers,
        invokers: invoker.invokers,
    }
}

const defaultInvokers = [{name: 'icinga2'}, {name: 'trello'}, {name: 'sensu'}];

@connect(mapStateToProps, {fetchInvokers})
@withTranslation('update_assistant')
@ListComponent('invokers')
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

    componentDidMount() {
        if(this.props.invokers.length === 0){
            this.props.openNextForm();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.invokers.length === 0 && !this.props.entity.invokerFileUpdate.isFinishUpdate && this.props.fetchingInvokers === API_REQUEST_STATE.FINISH){
            const {entity, updateEntity} = this.props;
            let newEntity = {...entity};
            newEntity.invokerFileUpdate = {...entity.invokerFileUpdate, isFinishUpdate: true};
            updateEntity(newEntity);
        }
    }

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {invokers, openNextForm} = this.props;
        if(invokers.length > index){
            this.setState({
                currentInvokerIndex: index,
            });
        } else{
            const {convertedInvokers} = this.state;
            const invokersWithErrors = convertedInvokers.filter(invoker => invoker.status.error !== null);
            const isFinishUpdate = invokersWithErrors.length === 0;
            const {entity, updateEntity} = this.props;
            let newEntity = {...entity};
            newEntity.invokerFileUpdate = {...entity.invokerFileUpdate, updatedInvokers: convertedInvokers, isFinishUpdate};
            updateEntity(newEntity);
            this.setState({
                currentInvokerIndex: -1,
            });
            if(isFinishUpdate) {
                openNextForm();
            }
        }
    }

    updateInvokers(){
        this.setState({
            convertedInvokers: [],
        }, () => this.convert(0));
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
        const {t, authUser, invokers, appVersion, entity} = this.props;
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
                                key={`${invoker.name}${key}`}
                                index={key}
                                invoker={invoker}
                                setInvoker={(a, b, c) => this.setInvoker(a, b, c)}
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
                    onClick={() => this.updateInvokers()}
                    float={'right'}
                    margin={'15px 0 40px'}
                />
                }
                {currentInvokerIndex !== -1 && <TooltipFontIcon isButton={true} tooltip={t('FORM.CANCEL_TOOLTIP')} value={'cancel'} iconClassName={'material-icons-outlined'} className={styles.cancel_icon} onClick={() => this.cancelConvert()}/>}
            </div>
        );
    }
}

export default InvokerFileUpdate;