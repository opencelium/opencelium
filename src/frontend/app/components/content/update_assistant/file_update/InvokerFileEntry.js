import React from 'react';
import PropTypes from 'prop-types';
import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/content/update_assistant/main";
import CExecution from "@classes/components/content/template_converter/CExecution";
import {connect} from "react-redux";
import Loading from "@components/general/app/Loading";
import TooltipSwitch from "@basic_components/tooltips/TooltipSwitch";
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

        this.state = {
            shouldUseNew: false,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevProps.isConverting && this.props.isConverting){
            ::this.convertInvoker();
        }
    }

    handleChangeMode(e){
        this.setState({
            shouldUseNew: e.target.checked,
        })
    }

    convertInvoker(){
        const {index, invoker, entity, setInvoker} = this.props;
        let convertedInvokers = null;
        let status = null;
        const {jsonData, error} = CExecution.executeConfig({
            fromVersion: invoker.version,
            toVersion: entity.availableUpdates.selectedVersion
        }, invoker.connection);
        //if (error.message !== '') {
        if(Math.floor(Math.random() * 2)){
            status = {error};
        }
        convertedInvokers = {...invoker, connection: jsonData, version: entity.availableUpdates.selectedVersion};
        setTimeout(() => {
            setInvoker(convertedInvokers, status, index);
        }, 100);
    }

    render(){
        const {shouldUseNew} = this.state;
        const {t, authUser, convertedInvokers, index, isConverting, invoker, defaultInvokers} = this.props;
        let isFail = false;
        let isSuccess = false;
        if(typeof convertedInvokers[index] !== 'undefined'){
            isFail = convertedInvokers[index].status !== null;
            isSuccess = convertedInvokers[index].status === null;
        }
        return(
            <tr>
                <td>{invoker.name}</td>
                <td>
                    {defaultInvokers.findIndex(defaultInvoker => defaultInvoker.name === invoker.name) !== -1
                    ?
                        <TooltipSwitch
                            id={`mode_${invoker.name}`}
                            authUser={authUser}
                            tooltip={!shouldUseNew ? t('FORM.INVOKER_MINE') : t('FORM.INVOKER_NEW')}
                            checked={shouldUseNew}
                            onChange={::this.handleChangeMode}
                        />
                    :
                        <span/>
                    }
                </td>
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