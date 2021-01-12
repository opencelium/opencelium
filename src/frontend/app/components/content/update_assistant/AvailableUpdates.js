import React from 'react';
import {connect} from 'react-redux';
import Button from "@basic_components/buttons/Button";
import styles from "@themes/default/content/available_updates/main";
import {API_REQUEST_STATE, Permissions} from "@utils/constants/app";
import Loading from "@components/general/app/Loading";
import {fetchOnlineUpdates, fetchOfflineUpdates} from "@actions/update_assistant/fetch";
import Table from "@basic_components/table/Table";
import RadioButtons from "@basic_components/inputs/RadioButtons";

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
        onlineUpdates: updateAssistant.get('onlineUpdates'),
        offlineUpdates: updateAssistant.get('offlineUpdates'),
    };
}

@connect(mapStateToProps, {fetchOnlineUpdates, fetchOfflineUpdates})
class AvailableUpdates extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            activeMode: '',
            startFetchingOnlineUpdates: false,
            startFetchingOfflineUpdates: false,
            selectedVersion: '',
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

    selectVersion(selectedVersion){
        this.setState({selectedVersion});
    }

    selectMode(e, activeMode){
        let {startFetchingOnlineUpdates, startFetchingOfflineUpdates} = this.state;
        const {fetchOnlineUpdates, fetchOfflineUpdates} = this.props;
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
        this.setState({
            selectedVersion: '',
            activeMode,
            startFetchingOnlineUpdates,
            startFetchingOfflineUpdates,
        });
    }

    renderUpdates(){
        const {activeMode, selectedVersion} = this.state;
        const {authUser, onlineUpdates, offlineUpdates, fetchingOnlineUpdates, fetchingOfflineUpdates} = this.props;
        let selectedUpdates = [];
        console.log(selectedVersion);
        switch (activeMode){
            case ONLINE_UPDATE:
                if(fetchingOnlineUpdates !== API_REQUEST_STATE.FINISH){
                    return null;
                }
                selectedUpdates = onlineUpdates;
                break;
            case OFFLINE_UPDATE:
                if(fetchingOfflineUpdates !== API_REQUEST_STATE.FINISH){
                    return null;
                }
                selectedUpdates = offlineUpdates;
                break;
        }
        if(selectedUpdates.length === 0){
            return null;
        }
        return(
            <Table className={styles.updates_table} authUser={authUser}>
                <thead>
                <tr>
                    <th>Version</th>
                    <th>Changelog</th>
                    <th>Select</th>
                </tr>
                </thead>
                <tbody>
                {selectedUpdates.map((version, key) => (
                    <tr key={version.name} className={version.status === VERSION_STATUS.OLD ? styles.disable_version_entry : ''}>
                        <td>{version.name}</td>
                        <td><a href={'#'}>Changelog</a></td>
                        <td>
                            {version.status !== VERSION_STATUS.OLD && version.status !== VERSION_STATUS.CURRENT && <RadioButtons
                                label={''}
                                value={selectedVersion}
                                handleChange={::this.selectVersion}
                                style={{textAlign: 'center'}}
                                radios={[{
                                    disabled: version.status === VERSION_STATUS.NOT_AVAILABLE,
                                    label: '',
                                    value: version.name,
                                    inputClassName: styles.radio_input,
                                    labelClassName: styles.radio_label,
                                }]}
                            />}
                            {version.status === VERSION_STATUS.OLD &&
                            <span>old</span>}
                            {version.status === VERSION_STATUS.CURRENT &&
                            <span>current</span>}
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
        )
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