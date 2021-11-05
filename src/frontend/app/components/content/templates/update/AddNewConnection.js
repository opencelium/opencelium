import React from 'react';
import {connect} from 'react-redux';
import Button from "@basic_components/buttons/Button";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Input from "@basic_components/inputs/Input";
import Dialog from "@basic_components/Dialog";
import {addConnection} from "@actions/connections/add";
import {checkConnectionTitle} from "@actions/connections/fetch";
import {withTranslation} from "react-i18next";
import {setFocusById} from "@utils/app";

function mapStateToProps(state){
    const connections = state.get('connections');
    return{
        checkingConnectionTitle: connections.get('checkingConnectionTitle'),
        checkTitleResult: connections.get('checkTitleResult'),
    }
}

@connect(mapStateToProps, {addConnection, checkConnectionTitle})
@withTranslation(['templates', 'app', 'basic_components'])
class AddNewConnection extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isToggledDialog: false,
            title: '',
            description: '',
            validateMessageTitle: '',
        }
        this.startCheckingConnectionTitle = false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {checkingConnectionTitle, checkTitleResult, t} = this.props;
        if(checkingConnectionTitle === API_REQUEST_STATE.FINISH && this.startCheckingConnectionTitle){
            this.startCheckingConnectionTitle = false;
            if(checkTitleResult.message === 'EXISTS') {
                this.setState({
                    validateMessageTitle: t('UPDATE.VALIDATION_MESSAGES.TITLE_EXIST'),
                })
                setFocusById('connection_title');
            } else{
                this.addConnection();
            }
        }
    }

    validateTitle(){
        const {title, description} = this.state;
        const {t, connection} = this.props;
        if(title.trim() === ''){
            this.setState({
                validationMessageTitle: t('UPDATE.VALIDATION_MESSAGES.TITLE_REQUIRED'),
            })
        } else{
            connection.title = title;
            connection.description = description;
            this.props.checkConnectionTitle(connection);
            this.startCheckingConnectionTitle = true;
        }
    }

    onChangeTitle(title){
        this.setState({
            title,
            validateMessageTitle: '',
        });
    }

    onChangeDescription(description){
        this.setState({
            description,
        });
    }

    toggleAddConnectionDialog(){
        this.setState({
            isToggledAddConnectionDialog: !this.state.isToggledAddConnectionDialog,
        })
    }

    addConnection(){
        const {title, description} = this.state;
        const {connection} = this.props;
        connection.title = title;
        connection.description = description;
        this.props.addConnection(connection.getObjectForBackend());
        this.toggleAddConnectionDialog();
    }

    render(){
        const {isToggledAddConnectionDialog, title, description, validateMessageTitle} = this.state;
        const {t, icon, checkingConnectionTitle} = this.props;
        return(
            <React.Fragment>
                <Button icon={icon} title={t('ADD_CONNECTION.BUTTON')} onClick={::this.toggleAddConnectionDialog} />
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.validateTitle}, {label: 'Cancel', onClick: ::this.toggleAddConnectionDialog}]}
                    active={isToggledAddConnectionDialog}
                    toggle={::this.toggleAddConnectionDialog}
                    title={t('ADD_CONNECTION.DIALOG_TITLE')}
                >
                    <Input id={'connection_title'} value={title} onChange={::this.onChangeTitle} isLoading={checkingConnectionTitle === API_REQUEST_STATE.START} error={validateMessageTitle} autoFocus required icon={'title'} maxLength={256} label={t(`UPDATE.FORM.TITLE`)}/>
                    <Input id={'connection_description'} value={description} onChange={::this.onChangeDescription} icon={'notes'} maxLength={1024} label={t(`UPDATE.FORM.DESCRIPTION`)}/>
                </Dialog>
            </React.Fragment>
        );
    }
}

export default AddNewConnection;