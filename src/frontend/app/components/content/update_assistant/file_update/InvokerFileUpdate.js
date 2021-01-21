import React from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import Table from "@basic_components/table/Table";
import styles from "@themes/default/content/update_assistant/main";
import Button from "@basic_components/buttons/Button";
import {updateInvokers, updateInvokersRejected} from "@actions/update_assistant/update";
import {fetchInvokers, fetchDefaultInvokers} from "@actions/invokers/fetch";
import {ListComponent} from "@decorators/ListComponent";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import InvokerFileEntry from "@components/content/update_assistant/file_update/InvokerFileEntry";


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const invokers = state.get('invokers');
    return {
        authUser: auth.get('authUser'),
        appVersion: app.get('appVersion'),
        fetchingInvokers: invokers.get('fetchingInvokers'),
        invokers: invokers.get('invokers').toJS(),
        fetchingDefaultInvokers: invokers.get('fetchingDefaultInvokers'),
        defaultInvokers: invokers.get('defaultInvokers').toJS(),
    }
}

@connect(mapStateToProps, {fetchInvokers, fetchDefaultInvokers, updateInvokers, updateInvokersRejected})
@withTranslation('update_assistant')
@ListComponent('invokers')
@ListComponent('defaultInvokers')
class InvokerFileUpdate extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            currentInvokerIndex: -1,
            convertedInvokers: [],
            isCanceledConvert: false,
        }
    }

    cancelConvert(){
        this.setState({
            isCanceledConvert: true,
        });
    }

    convert(index){
        const {invokers} = this.props;
        if(invokers.length > index){
            this.setState({
                currentInvokerIndex: index,
            });
        } else{
            const {convertedInvokers} = this.state;
            let isFinishUpdate = convertedInvokers.filter(invoker => invoker.status !== null).length === 0;
            const {entity, updateEntity} = this.props;
            entity.invokerFileUpdate = {...entity.invokerFileUpdate, updatedInvokers: convertedInvokers, isFinishUpdate};
            updateEntity(entity);
            this.setState({
                currentInvokerIndex: -1,
            });
        }
    }

    updateInvokers(){
        const {updateInvokers} = this.props;
        this.setState({
            convertedInvokers: [],
        }, () => ::this.convert(0));
        //updateInvokers(convertedInvokers);
    }

    setInvoker(invoker, status, index){
        this.setState({
            convertedInvokers: [...this.state.convertedInvokers, {data: invoker, status}]
        }, () => {
            if(!this.state.isCanceledConvert) {
                this.convert(index + 1)
            } else{
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
        return(
            <div style={{margin: '20px 68px 0px 0px'}}>
                <Table className={styles.table} authUser={authUser}>
                    <thead>
                    <tr>
                        <th>{`v${appVersion}`}</th>
                        <th style={{paddingRight: invokers.length > 6 ? '35px' : ''}}>{'Mode'}</th>
                        <th style={{paddingRight: invokers.length > 6 ? '35px' : ''}}>{entity.availableUpdates.selectedVersion}</th>
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
                {currentInvokerIndex !== -1 && <TooltipFontIcon isButton={true} tooltip={'Cancel'} value={'cancel'} iconClassName={'material-icons-outlined'} className={styles.cancel_icon} onClick={::this.cancelConvert}/>}
            </div>
        );
    }
}

export default InvokerFileUpdate;