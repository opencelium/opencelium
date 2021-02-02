import React from 'react';
import PropTypes from 'prop-types';
import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/content/update_assistant/main";
import CExecution from "@classes/components/content/invoker_converter/CExecution";
import {connect} from "react-redux";
import Loading from "@components/general/app/Loading";
import {withTranslation} from "react-i18next";

function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    return {
        authUser: auth.get('authUser'),
        appVersion: app.get('appVersion'),
    }
}

@connect(mapStateToProps, {})
@withTranslation('update_assistant')
class InvokerFileEntry extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevProps.isConverting && this.props.isConverting){
            ::this.convertInvoker();
        }
    }

    convertInvoker(){
        const {index, invoker, entity, setInvoker, appVersion} = this.props;
        let convertedInvoker = null;
        let status = {error: null};
        const {invokerData, error} = CExecution.executeConfig({
            fromVersion: appVersion,
            toVersion: entity.availableUpdates.selectedVersion
        }, invoker);
        if (error.message !== '') {
        //if(Math.floor(Math.random() * 2)){
            status = {error};
        }
        convertedInvoker = invokerData;
        setTimeout(() => {
            setInvoker(convertedInvoker, status, index);
        }, 100);
    }

    render(){
        const {convertedInvokers, index, isConverting, invoker} = this.props;
        let isFail = false;
        let isSuccess = false;
        if(typeof convertedInvokers[index] !== 'undefined'){
            isFail = convertedInvokers[index].status.error !== null;
            isSuccess = convertedInvokers[index].status.error === null;
        }
        return(
            <tr>
                <td>{invoker.name}</td>
                <td>
                    {!isConverting && !isFail && !isSuccess && <span>-</span>}
                    {isConverting && <Loading className={styles.convert_loading}/>}
                    {isSuccess && <FontIcon value={'done'} size={18} className={styles.convert_success}/>}
                    {isFail && <FontIcon value={'close'} size={18} className={styles.convert_fail}/>}
                </td>
            </tr>
        );
    }
}

InvokerFileEntry.defaultProps = {
    isConverting: false,
    status: null,
};

InvokerFileEntry.propTypes = {
    index: PropTypes.number.isRequired,
    isConverting: PropTypes.bool,
    invoker: PropTypes.object.isRequired,
    setInvoker: PropTypes.func.isRequired,
};

export default InvokerFileEntry;