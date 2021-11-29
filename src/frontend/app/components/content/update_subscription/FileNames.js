import React from "react";
import {connect} from 'react-redux';
import {API_REQUEST_STATE} from "@utils/constants/app";
import {fetchSubscriptionUpdate} from "@actions/subscription_update/fetch";
import Loading from "@components/general/app/Loading";
import styles from "@themes/default/content/update_subscription/main.scss";


function mapStateToProps(state){
    const updateSubscription = state.get('subscription_update');
    return{
        hasUpdate: updateSubscription.get('hasUpdate'),
        fileNames: updateSubscription.get('fileNames').toJS(),
        fetchingSubscriptionUpdate: updateSubscription.get('fetchingSubscriptionUpdate'),
        doingSubscriptionUpdate: updateSubscription.get('doingSubscriptionUpdate'),
    };
}

@connect(mapStateToProps, {fetchSubscriptionUpdate})
class FileNames extends React.Component{
    constructor(props) {
        super(props);
        this.shouldCheckFilesAfterUpdate = true;
    }

    componentDidMount() {
        const {fetchingSubscriptionUpdate, fetchSubscriptionUpdate} = this.props;
        if(fetchingSubscriptionUpdate !== API_REQUEST_STATE.START) {
            fetchSubscriptionUpdate({background: true});
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {doingSubscriptionUpdate, fetchSubscriptionUpdate} = this.props;
        if(doingSubscriptionUpdate === API_REQUEST_STATE.FINISH && this.shouldCheckFilesAfterUpdate){
            this.shouldCheckFilesAfterUpdate = false;
            fetchSubscriptionUpdate({background: true});
        }
    }

    render(){
        const {fileNames, fetchingSubscriptionUpdate} = this.props;
        if(fetchingSubscriptionUpdate !== API_REQUEST_STATE.FINISH){
            return <Loading/>;
        }
        return(
            <div className={styles.file_names}>
                {fileNames.length === 0 && <div>There are no new files</div>}
                {fileNames.map(fileName => <div key={fileName} title={fileName}>{fileName}</div>)}
            </div>
        );
    }
}

export default FileNames;