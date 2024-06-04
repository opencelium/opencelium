 /*
 *  Copyright (C) <2023>  <becon GmbH>
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
import {Progress} from 'reactstrap';
import {withTranslation} from "react-i18next";
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import Table from "@basic_components/table/Table";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import OldVersionEntry from "@entity/update_assistant/components/available_updates/OldVersionEntry";
import {uploadOnlineVersion, getOnlineUpdates as fetchOnlineUpdates, getOfflineUpdates as fetchOfflineUpdates, uploadApplicationFile as uploadVersion} from "@entity/update_assistant/redux_toolkit/action_creators/UpdateAssistantCreators";
import {API_REQUEST_STATE, VERSION_STATUS} from "@application/interfaces/IApplication";
import Loading from "@app_component/base/loading/Loading";
 import {TextSize} from "@app_component/base/text/interfaces";
 import {ExportButtonStyled, ImportButtonStyled} from "@entity/update_assistant/components/available_updates/styles";
 import InputFile from "@app_component/base/input/file/InputFile";

export const ONLINE_UPDATE = 'ONLINE_UPDATE';
export const OFFLINE_UPDATE = 'OFFLINE_UPDATE';


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const updateAssistant = state.updateAssistantReducer;
    return{
        authUser,
        uploadingOnlineVersion: updateAssistant.uploadingOnlineVersion,
        fetchingOnlineUpdates: updateAssistant.gettingOnlineUpdates,
        fetchingOfflineUpdates: updateAssistant.gettingOfflineUpdates,
        uploadingVersion: updateAssistant.uploadingApplicationFile,
        onlineUpdates: updateAssistant.onlineUpdates,
        offlineUpdates: updateAssistant.offlineUpdates,
        error: updateAssistant.error,
    };
}
/*
* TODO: implement cancel requests when switch online to offline
*/
@connect(mapStateToProps, {fetchOnlineUpdates, fetchOfflineUpdates, uploadVersion, uploadOnlineVersion})
@withTranslation('update_assistant')
class AvailableUpdates extends React.Component{
    constructor(props) {
        super(props);

        const {entity} = props;

        this.state = {
            activeMode: entity.availableUpdates.mode,
            startUploadingOnlineVersion: false,
            startFetchingOnlineUpdates: false,
            startFetchingOfflineUpdates: false,
            selectedVersionName: entity.availableUpdates.selectedVersion ? entity.availableUpdates.selectedVersion.name : '',
            isOldVersionsExtended: false,
            isNewVersionsExtended: false,
            uploadProgress: 0,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        const {startFetchingOnlineUpdates, startFetchingOfflineUpdates, startUploadingOnlineVersion} = this.state;
        if(this.props.uploadingOnlineVersion === API_REQUEST_STATE.FINISH && startUploadingOnlineVersion) {
            this.setState({
                startUploadingOnlineVersion: false,
            })
            this.props.openNextForm();
        }
        if(prevProps.uploadingVersion === API_REQUEST_STATE.START && this.props.uploadingVersion === API_REQUEST_STATE.FINISH) {
            this.setState({
                uploadProgress: 0,
            })
        }
        if(this.props.fetchingOnlineUpdates === API_REQUEST_STATE.FINISH && startFetchingOnlineUpdates){
            this.setState({
                startFetchingOnlineUpdates: false,
            });
        }
        if(this.props.fetchingOfflineUpdates === API_REQUEST_STATE.FINISH && startFetchingOfflineUpdates){
            this.setState({
                startFetchingOfflineUpdates: false,
            });
        }
    }

    uploadVersion(f){
        if(f) {
            this.props.uploadVersion({applicationFile: f, onUploadProgress: data => {
                this.setState({uploadProgress: Math.round((100 * data.loaded) / data.total)})
            }});
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
        const {activeMode} = this.state;
        const {entity, updateEntity, openNextForm} = this.props;
        let newEntity = {...entity};
        const updates = this.getUpdates();
        const selectedVersion = updates.available.find(version => version.name === selectedVersionName);
        if(selectedVersion) {
            newEntity.availableUpdates = {...entity.availableUpdates, selectedVersion};
            updateEntity(newEntity);
            let newState = {selectedVersionName};
            this.setState(newState);
            openNextForm();
        }
    }

    selectMode(e, activeMode){
        let {startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        let {
            fetchOnlineUpdates, fetchOfflineUpdates, entity, updateEntity,
        } = this.props;
        let newEntity = {...entity};
        switch (activeMode){
            case ONLINE_UPDATE:
                fetchOnlineUpdates();
                startFetchingOnlineUpdates = true;
                break;
            case OFFLINE_UPDATE:
                fetchOfflineUpdates();
                startFetchingOfflineUpdates = true;
                break;
        }
        newEntity.availableUpdates = {...entity.availableUpdates, mode: activeMode, selectedVersion: null};
        updateEntity(newEntity)
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
                selectedUpdates = [...onlineUpdates];
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
        let updates = this.getUpdates().old;
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
                                            onClick={() => this.toggleOldVersions()}
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
        const {selectedVersionName, isOldVersionsExtended, isNewVersionsExtended, activeMode, startUploadingOnlineVersion, startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        const {t, authUser, fetchingOnlineUpdates, fetchingOfflineUpdates, error, openNextForm, uploadingOnlineVersion, uploadingVersion} = this.props;
        let updates = this.getUpdates();
        if(updates.available.length === 0 && updates.old.length === 0 && updates.veryNew.length === 0){
            if(activeMode !== '' && !(fetchingOnlineUpdates === API_REQUEST_STATE.START || fetchingOfflineUpdates === API_REQUEST_STATE.START)){
                if(error === null){
                    return (
                        <div>
                            {uploadingVersion !== API_REQUEST_STATE.START && <div className={styles.no_versions}>
                                <span>{"There are no updates"}</span>
                            </div>}
                            {this.renderUploadButton()}
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
                            {this.renderOldUpdates()}
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
                                                    handleChange={(a) => this.selectVersion(a)}
                                                    style={{textAlign: 'center'}}
                                                    radios={[{
                                                        label: '',
                                                        isLoading: uploadingOnlineVersion === API_REQUEST_STATE.START && startUploadingOnlineVersion && selectedVersionName === version.name,
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
                            {this.renderNewUpdates()}
                        </tbody>
                    </Table>
                </div>
                {this.renderUploadButton()}
            </React.Fragment>
        )
    }

    renderNewUpdates(){
        const {isNewVersionsExtended, selectedVersionName} = this.state;
        const {t} = this.props;
        let updates = this.getUpdates().veryNew;
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
                                            size={20} onClick={() => this.toggleNewVersions()}
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
                                    handleChange={(a) => {}}
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
        const {activeMode, uploadProgress} = this.state;
        console.log(activeMode)
        if(activeMode === OFFLINE_UPDATE) {
            console.log(uploadingVersion)
            if(uploadingVersion !== API_REQUEST_STATE.START) {
                return (
                    <div style={{float: 'right'}}>
                        <InputFile
                            id={`input_upload`}
                            icon={'attach_file'}
                            label={t('FORM.UPLOAD_UPDATE')}
                            accept={'.zip'}
                            onChange={(file) => this.uploadVersion(file)}
                            showOnlyButton={true}
                        />
                    </div>
                );
            } else{
                return (
                    <div style={{marginTop: '30px'}}>
                        <Progress
                            style={{height: '25px', width: '100%'}}
                            className="my-2"
                            value={uploadProgress}
                        >{`${uploadProgress}%`}</Progress>
                    </div>
                );
            }
        }
        return null;
    }

    render(){
        const {activeMode, startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        const {t, authUser, fetchingOnlineUpdates, fetchingOfflineUpdates} = this.props;
        return(
            <div style={{margin: '20px 0 0 0'}}>
                <div style={{textAlign: 'center'}}>
                    <ImportButtonStyled
                        disabled={!authUser.userDetail.themeSync}
                        isActive={activeMode === ONLINE_UPDATE}
                        authUser={authUser}
                        title={!authUser.userDetail.themeSync ? 'Please, activate sync in profile settings' : 'Online'}
                        label={'Online'}
                        onClick={(e) => this.selectMode(e, ONLINE_UPDATE)}
                        size={TextSize.Size_16}
                    />
                    <ExportButtonStyled
                        isActive={activeMode === OFFLINE_UPDATE}
                        authUser={authUser}
                        title={t('FORM.OFFLINE')}
                        onClick={(e) => this.selectMode(e, OFFLINE_UPDATE)}
                        size={TextSize.Size_16}
                    />
                    {
                        (fetchingOnlineUpdates === API_REQUEST_STATE.START || fetchingOfflineUpdates === API_REQUEST_STATE.START) &&
                            <Loading top={'30px'}/>
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
