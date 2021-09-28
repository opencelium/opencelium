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
import Button from "@basic_components/buttons/Button";
import styles from "@themes/default/content/update_assistant/main";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Loading from "@loading";
import {
    fetchOnlineUpdates, fetchOnlineUpdatesCanceled,
    fetchOfflineUpdates, fetchOfflineUpdatesCanceled,
} from "@actions/update_assistant/fetch";
import {uploadVersion} from "@actions/update_assistant/add";
import Table from "@basic_components/table/Table";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import OldVersionEntry from "@components/content/update_assistant/available_updates/OldVersionEntry";
import BrowseButton from "@basic_components/buttons/BrowseButton";

export const ONLINE_UPDATE = 'ONLINE_UPDATE';
export const OFFLINE_UPDATE = 'OFFLINE_UPDATE';

const VERSION_STATUS = {
    OLD: 'old',
    CURRENT: 'current',
    AVAILABLE: 'available',
    NOT_AVAILABLE: 'not_available'
}

function mapStateToProps(state){
    const auth = state.get('auth');
    const updateAssistant = state.get('update_assistant');
    return{
        authUser: auth.get('authUser'),
        fetchingOnlineUpdates: updateAssistant.get('fetchingOnlineUpdates'),
        fetchingOfflineUpdates: updateAssistant.get('fetchingOfflineUpdates'),
        uploadingVersion: updateAssistant.get('uploadingVersion'),
        onlineUpdates: updateAssistant.get('onlineUpdates').toJS(),
        offlineUpdates: updateAssistant.get('offlineUpdates').toJS(),
        error: updateAssistant.get('error'),
    };
}

@connect(mapStateToProps, {fetchOnlineUpdates, fetchOfflineUpdates, uploadVersion, fetchOnlineUpdatesCanceled, fetchOfflineUpdatesCanceled})
@withTranslation('update_assistant')
class AvailableUpdates extends React.Component{
    constructor(props) {
        super(props);

        const {entity} = props;

        this.state = {
            activeMode: entity.availableUpdates.mode,
            startFetchingOnlineUpdates: false,
            startFetchingOfflineUpdates: false,
            selectedVersionName: entity.availableUpdates.selectedVersion ? entity.availableUpdates.selectedVersion.name : '',
            isOldVersionsExtended: false,
            isNewVersionsExtended: false,
        }
    }

    componentDidUpdate(){
        const {startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        if(this.props.fetchingOnlineUpdates === API_REQUEST_STATE.FINISH && startFetchingOnlineUpdates === true){
            this.setState({
                startFetchingOnlineUpdates: false,
            });
        }
        if(this.props.fetchingOfflineUpdates === API_REQUEST_STATE.FINISH && startFetchingOfflineUpdates === true){
            this.setState({
                startFetchingOfflineUpdates: false,
            });
        }
    }

    uploadVersion(e){
        const f = e.target.files[0];
        if(f) {
            this.props.uploadVersion({versionFile: f});
        }
    }

    toggleOldVersions(){
        this.setState({
            isOldVersionsExtended: !this.state.isOldVersionsExtended,
        });
    }

    toggleNewVersions(){
        this.setState({
            isNewVersionsExtended: !this.state.isNewVersionsExtended,
        });
    }

    selectVersion(selectedVersionName){
        const {entity, updateEntity, openNextForm} = this.props;
        const updates = ::this.getUpdates();
        const selectedVersion = updates.available.find(version => version.name === selectedVersionName);
        if(selectedVersion) {
            entity.availableUpdates = {...entity.availableUpdates, selectedVersion};
            updateEntity(entity)
            this.setState({selectedVersionName});
            openNextForm();
        }
    }

    selectMode(e, activeMode){
        let {startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        const {
            fetchOnlineUpdates, fetchOnlineUpdatesCanceled, fetchOfflineUpdates, fetchOfflineUpdatesCanceled,
            fetchingOnlineUpdates, fetchingOfflineUpdates, entity, updateEntity,
        } = this.props;
        switch (activeMode){
            case ONLINE_UPDATE:
                fetchOnlineUpdates();
                if(fetchingOfflineUpdates === API_REQUEST_STATE.START) fetchOfflineUpdatesCanceled();
                startFetchingOnlineUpdates = true;
                break;
            case OFFLINE_UPDATE:
                fetchOfflineUpdates();
                if(fetchingOnlineUpdates === API_REQUEST_STATE.START) fetchOnlineUpdatesCanceled();
                startFetchingOfflineUpdates = true;
                break;
        }
        entity.availableUpdates = {...entity.availableUpdates, mode: activeMode, selectedVersion: null};
        updateEntity(entity)
        this.setState({
            selectedVersionName: '',
            activeMode,
            startFetchingOnlineUpdates,
            startFetchingOfflineUpdates,
            isOldVersionsExtended: false,
            isNewVersionsExtended: false,
        });
    }

    getUpdates(){
        const {activeMode} = this.state;
        const {onlineUpdates, offlineUpdates, fetchingOnlineUpdates, fetchingOfflineUpdates} = this.props;
        let selectedUpdates = [];
        let updates = {
            old: [],
            available: [],
            veryNew: [],
        };
        switch (activeMode){
            case ONLINE_UPDATE:
                if(fetchingOnlineUpdates !== API_REQUEST_STATE.FINISH){
                    return updates;
                }
                selectedUpdates = [...onlineUpdates, {name: 'v2.1.0', status: 'available'}];
                break;
            case OFFLINE_UPDATE:
                if(fetchingOfflineUpdates !== API_REQUEST_STATE.FINISH){
                    return updates;
                }
                selectedUpdates = offlineUpdates;
                break;
        }
        for(let i = 0; i < selectedUpdates.length; i++){
            switch(selectedUpdates[i].status){
                case VERSION_STATUS.OLD:
                    updates.old.push(selectedUpdates[i]);
                    break;
                case VERSION_STATUS.CURRENT:
                case VERSION_STATUS.AVAILABLE:
                    updates.available.push(selectedUpdates[i]);
                    break;
                case VERSION_STATUS.NOT_AVAILABLE:
                    updates.veryNew.push(selectedUpdates[i]);
                    break;
            }
        }
        return updates;
    }

    renderOldUpdates(){
        const {t} = this.props;
        const {isOldVersionsExtended, activeMode} = this.state;
        let updates = ::this.getUpdates().old;
        if(updates.length === 0){
            return null;
        }
        return(
            <React.Fragment>
                {updates.map((version, key) => {
                    if(updates.length > 1 && !isOldVersionsExtended){
                        if(key === updates.length - 2){
                            return (
                                <tr key={'extend'}>
                                    <td/>
                                    <td style={{padding: 0}}>
                                        <TooltipFontIcon
                                            className={styles.more_icon}
                                            size={20}
                                            onClick={::this.toggleOldVersions}
                                            tooltip={t('FORM.MORE_OLD_VERSIONS')}
                                            isButton={true}
                                            value={<span>...</span>}
                                        />
                                    </td>
                                    <td/>
                                </tr>
                            );
                        }
                        if(key < updates.length - 1){
                            return null;
                        }
                    }
                    return (
                        <OldVersionEntry key={version.name} version={version} activeMode={activeMode}/>
                    );
                })}
            </React.Fragment>
        )
    }

    renderUpdates(){
        const {selectedVersionName, isOldVersionsExtended, isNewVersionsExtended, activeMode, startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        const {t, authUser, fetchingOnlineUpdates, fetchingOfflineUpdates, error} = this.props;
        let updates = ::this.getUpdates();
        if(updates.available.length === 0 && updates.old.length === 0 && updates.veryNew.length === 0){
            if(activeMode !== '' && !(fetchingOnlineUpdates === API_REQUEST_STATE.START || fetchingOfflineUpdates === API_REQUEST_STATE.START)){
                if(error === null){
                    return (
                        <div>
                            <div className={styles.no_versions}>
                                <span>{"There are no updates"}</span>
                            </div>
                            {::this.renderUploadButton()}
                        </div>
                    );
                } else{
                    return <div className={styles.no_versions}>{"There are some errors"}</div>;
                }
            }
            return null;
        }
        let numberOfVisibleEntries = updates.available.length;
        if(isOldVersionsExtended){
            numberOfVisibleEntries += updates.old.length;
        } else{
            if(updates.old.length > 0){
                numberOfVisibleEntries++;
            }
            if(updates.old.length > 1){
                numberOfVisibleEntries++;
            }
        }
        if(isNewVersionsExtended){
            numberOfVisibleEntries += updates.veryNew.length;
        } else{
            if(updates.veryNew.length > 0){
                numberOfVisibleEntries++;
            }
            if(updates.veryNew.length > 1){
                numberOfVisibleEntries++;
            }
        }
        return(
            <React.Fragment>
                <Table className={styles.table} authUser={authUser}>
                    <thead>
                    <tr>
                        <th>{t('FORM.VERSION_HEADER')}</th>
                        <th>{t('FORM.CHANGELOG_HEADER')}</th>
                        <th style={{paddingRight: numberOfVisibleEntries > 6 ? '35px' : ''}}>{t('FORM.SELECT_HEADER')}</th>
                    </tr>
                    </thead>
                </Table>
                <div className={styles.table_content}>
                    <Table authUser={authUser}>
                        <tbody>
                            {::this.renderOldUpdates()}
                            {updates.available.map(version => (
                                <tr key={version.name}>
                                    <td>{version.name}</td>
                                    <td><a href={version.changelogLink} target={'_blank'}>{t('FORM.CHANGELOG')}</a></td>
                                    <td>
                                        {version.status !== VERSION_STATUS.CURRENT
                                            ?
                                                <RadioButtons
                                                    label={''}
                                                    value={selectedVersionName}
                                                    handleChange={::this.selectVersion}
                                                    style={{textAlign: 'center'}}
                                                    radios={[{
                                                        label: '',
                                                        value: version.name,
                                                        inputClassName: styles.radio_input,
                                                        labelClassName: styles.radio_label,
                                                    }]}/>
                                            :
                                                <span>{t('FORM.CURRENT_VERSION')}</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                            {::this.renderNewUpdates()}
                        </tbody>
                    </Table>
                </div>
                {::this.renderUploadButton()}
            </React.Fragment>
        )
    }

    renderNewUpdates(){
        const {t} = this.props;
        const {isNewVersionsExtended, selectedVersionName} = this.state;
        let updates = ::this.getUpdates().veryNew;
        if(updates.length === 0){
            return null;
        }
        return(
            <React.Fragment>
                {updates.map((version, key) => {
                    if(updates.length > 1 && !isNewVersionsExtended){
                        if(key === 1){
                            return (
                                <tr key={'extend'}>
                                    <td/>
                                    <td style={{padding: 0}}>
                                        <TooltipFontIcon
                                            className={styles.more_icon}
                                            size={20} onClick={::this.toggleNewVersions}
                                            tooltip={t('FORM.MORE_NEW_VERSIONS')}
                                            isButton={true}
                                            value={<span>...</span>}
                                        />
                                    </td>
                                    <td/>
                                </tr>
                            );
                        }
                        if(key > 1){
                            return null;
                        }
                    }
                    return (
                        <tr key={version.name}>
                            <td>{version.name}</td>
                            <td><a href={version.changelogLink} target={'_blank'}>{t('FORM.CHANGELOG')}</a></td>
                            <td>
                                <RadioButtons
                                    label={''}
                                    value={selectedVersionName}
                                    handleChange={() => {}}
                                    style={{textAlign: 'center'}}
                                    radios={[{
                                        disabled: true,
                                        label: '',
                                        value: version.name,
                                        inputClassName: styles.radio_input,
                                        labelClassName: styles.radio_label,
                                    }]}/>
                            </td>
                        </tr>
                    );
                })}
            </React.Fragment>
        )
    }

    renderUploadButton(){
        const {t, uploadingVersion} = this.props;
        const {activeMode} = this.state;
        if(activeMode === OFFLINE_UPDATE) {
            if(uploadingVersion !== API_REQUEST_STATE.START) {
                return <BrowseButton
                    onlyButton={true}
                    browseTitle={''}
                    browseProps={{
                        icon: 'attach_file',
                        label: t('FORM.UPLOAD_UPDATE'),
                        accept: ".zip",
                        style: {margin: '15px 0 40px 0', float: 'right'},
                        onChange: ::this.uploadVersion,
                    }}
                />;
            } else{
                return <Loading className={styles.upload_version_loading}/>;
            }
        }
        return null;
    }

    render(){
        const {activeMode, startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        const {t, authUser, fetchingOnlineUpdates, fetchingOfflineUpdates} = this.props;
        return(
            <div style={{margin: '20px 68px 0 0'}}>
                <div style={{textAlign: 'center'}}>
                    <Button
                        isActive={activeMode === ONLINE_UPDATE}
                        authUser={authUser}
                        title={t('FORM.ONLINE')}
                        onClick={(e) => ::this.selectMode(e, ONLINE_UPDATE)}
                        className={styles.online_button}
                    />
                    <Button
                        isActive={activeMode === OFFLINE_UPDATE}
                        authUser={authUser}
                        title={t('FORM.OFFLINE')}
                        onClick={(e) => ::this.selectMode(e, OFFLINE_UPDATE)}
                        className={styles.offline_button}
                    />
                    {
                        (fetchingOnlineUpdates === API_REQUEST_STATE.START || fetchingOfflineUpdates === API_REQUEST_STATE.START) &&
                            <Loading className={styles.available_updates_loading}/>
                    }
                    {
                        this.renderUpdates()
                    }
                </div>
            </div>
        );
    }
}

export default AvailableUpdates;