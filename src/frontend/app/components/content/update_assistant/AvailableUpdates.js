import React from 'react';
import {connect} from 'react-redux';
import Button from "@basic_components/buttons/Button";
import styles from "@themes/default/content/available_updates/main";
import {API_REQUEST_STATE, Permissions} from "@utils/constants/app";
import Loading from "@components/general/app/Loading";
import {fetchOnlineUpdates, fetchOfflineUpdates} from "@actions/update_assistant/fetch";
import {uploadVersion} from "@actions/update_assistant/add";
import Table from "@basic_components/table/Table";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import OldVersionEntry from "@components/content/update_assistant/OldVersionEntry";
import BrowseButton from "@basic_components/buttons/BrowseButton";

const ONLINE_UPDATE = 'ONLINE_UPDATE';
const OFFLINE_UPDATE = 'OFFLINE_UPDATE';

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
    };
}

@connect(mapStateToProps, {fetchOnlineUpdates, fetchOfflineUpdates, uploadVersion})
class AvailableUpdates extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            activeMode: '',
            startFetchingOnlineUpdates: false,
            startFetchingOfflineUpdates: false,
            selectedVersion: '',
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

    componentWillUnmount(){
        const {entity, updateEntity} = this.props;
        entity.availableUpdates = {selectedVersion: '', mode: ''};
        updateEntity(entity);
    }

    uploadVersion(){
        this.props.uploadVersion({id: 10, name: 'v1.5', changeLogLink: '', status: 'not_available'},)
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

    selectVersion(selectedVersion){
        const {entity, updateEntity} = this.props;
        entity.availableUpdates = {...entity.availableUpdates, selectedVersion};
        updateEntity(entity)
        this.setState({selectedVersion});
    }

    selectMode(e, activeMode){
        let {startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        const {fetchOnlineUpdates, fetchOfflineUpdates, entity, updateEntity} = this.props;
        switch (activeMode){
            case ONLINE_UPDATE:
                fetchOnlineUpdates({background: true});
                startFetchingOnlineUpdates = true;
                break;
            case OFFLINE_UPDATE:
                fetchOfflineUpdates({background: true});
                startFetchingOfflineUpdates = true;
                break;
        }
        entity.availableUpdates = {...entity.availableUpdates, mode: activeMode};
        updateEntity(entity)
        this.setState({
            selectedVersion: '',
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
                selectedUpdates = onlineUpdates;
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
        const {isOldVersionsExtended} = this.state;
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
                                        <TooltipFontIcon className={styles.more_icon} size={20} onClick={::this.toggleOldVersions} tooltip={'More Old Versions'} isButton={true} value={<span>...</span>}/>
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
                        <OldVersionEntry version={version}/>
                    );
                })}
            </React.Fragment>
        )
    }

    renderUpdates(){
        const {selectedVersion, isOldVersionsExtended, isNewVersionsExtended} = this.state;
        const {authUser} = this.props;
        let updates = ::this.getUpdates();
        if(updates.available.length === 0){
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
                <Table className={styles.updates_table} authUser={authUser}>
                    <thead>
                    <tr>
                        <th>Version</th>
                        <th>Changelog</th>
                        <th style={{paddingRight: numberOfVisibleEntries > 6 ? '35px' : ''}}>Select</th>
                    </tr>
                    </thead>
                </Table>
                <div className={styles.updates_table_content}>
                    <Table authUser={authUser}>
                        <tbody>
                            {::this.renderOldUpdates()}
                            {updates.available.map(version => (
                                <tr key={version.name}>
                                    <td>{version.name}</td>
                                    <td><a href={'#'}>Changelog</a></td>
                                    <td>
                                        {version.status !== VERSION_STATUS.CURRENT
                                            ?
                                                <RadioButtons
                                                    label={''}
                                                    value={selectedVersion}
                                                    handleChange={::this.selectVersion}
                                                    style={{textAlign: 'center'}}
                                                    radios={[{
                                                        label: '',
                                                        value: version.name,
                                                        inputClassName: styles.radio_input,
                                                        labelClassName: styles.radio_label,
                                                    }]}/>
                                            :
                                                <span>current</span>
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
        const {isNewVersionsExtended, selectedVersion} = this.state;
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
                                        <TooltipFontIcon className={styles.more_icon} size={20} onClick={::this.toggleNewVersions} tooltip={'More New Versions'} isButton={true} value={<span>...</span>}/>
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
                            <td><a href={'#'}>Changelog</a></td>
                            <td>
                                <RadioButtons
                                    label={''}
                                    value={selectedVersion}
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
        const {uploadingVersion} = this.props;
        const {activeMode} = this.state;
        if(activeMode === OFFLINE_UPDATE) {
            if(uploadingVersion !== API_REQUEST_STATE.START) {
                return <BrowseButton
                    onlyButton={true}
                    browseTitle={''}
                    browseProps={{
                        icon: 'attach_file',
                        label: "Upload update",
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
        const {authUser} = this.props;
        return(
            <div style={{margin: '20px 68px 0 0'}}>
                <div style={{textAlign: 'center'}}>
                    <Button
                        isActive={activeMode === ONLINE_UPDATE}
                        authUser={authUser}
                        title={'Online'}
                        onClick={(e) => ::this.selectMode(e, ONLINE_UPDATE)}
                        className={styles.online_button}
                    />
                    <Button
                        isActive={activeMode === OFFLINE_UPDATE}
                        authUser={authUser}
                        title={'Offline'}
                        onClick={(e) => ::this.selectMode(e, OFFLINE_UPDATE)}
                        className={styles.offline_button}
                    />
                    {
                        (startFetchingOnlineUpdates || startFetchingOfflineUpdates) &&
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