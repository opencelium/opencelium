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

import React from "react";
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import { Row, Col, Container } from "react-grid-system";
import {ListComponent} from "@entity/connection/components/decorators/ListComponent";
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import Translate from "@entity/connection/components/components/general/app/Translate";
import {APP_STATUS_DOWN, APP_STATUS_UP} from "@entity/connection/components/utils/constants/url";
import theme from "react-toolbox/lib/input/theme.css";
import basicComponentsStyles from "@entity/connection/components/themes/default/general/basic_components";
import {checkAllExternalApplications as fetchSystemRequirements} from "@entity/external_application/redux_toolkit/action_creators/ExternalApplicationCreators";
import {checkApplicationBeforeUpdate as checkResetFiles} from "@entity/update_assistant/redux_toolkit/action_creators/UpdateAssistantCreators";
import {API_REQUEST_STATE, OC_NAME} from "@application/interfaces/IApplication";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const updateAssistant = state.updateAssistantReducer;
    const externalApplication = state.externalApplicationReducer;
    return{
        authUser,
        fetchingSystemRequirements: externalApplication.checkingAll,
        systemRequirements: externalApplication.actuatorHealth,
        checkingResetFiles: updateAssistant.checkingApplicationBeforeUpdate,
        checkResetFilesResult: updateAssistant.checkResetFiles,
    }
}

@withTranslation('update_assistant')
@connect(mapStateToProps, {fetchSystemRequirements, checkResetFiles})
@ListComponent('systemRequirements')
class SystemOverview extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            validationMessage: '',
        }
    }

    setValidationMessage(validationMessage){
        this.setState({
            validationMessage,
        });
    }

    componentDidMount() {
        let {entity, updateEntity, systemRequirements} = this.props;
        entity = {...entity, systemRequirements};
        updateEntity(entity);
        this.validateSystemRequirements(entity);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {t, checkingResetFiles, checkResetFilesResult, openNextForm} = this.props;
        if(prevProps.checkingResetFiles === API_REQUEST_STATE.START && checkingResetFiles !== API_REQUEST_STATE.START){
            if(checkResetFilesResult.message !== 'EXISTS'){
                this.setValidationMessage(t('FORM.VALIDATION_MESSAGES.RESET_FILES_NOT_EXIST'));
            } else{
                if(this.state.validationMessage !== ''){
                    openNextForm();
                }
            }
        }
    }

    /**
     * to validate system requirements
     */
    validateSystemRequirements(entity){
        const {t, checkResetFiles} = this.props;
        const isNeo4jUp = entity.systemRequirements && entity.systemRequirements.hasOwnProperty('details') && entity.systemRequirements.details && entity.systemRequirements.details.hasOwnProperty('neo4j') && entity.systemRequirements.details.neo4j.status === APP_STATUS_UP;
        const isOCVersionUnknown = !entity.systemRequirements.hasOwnProperty('details') || !entity.systemRequirements.details.hasOwnProperty(OC_NAME.toLowerCase()) || entity.systemRequirements.details[OC_NAME.toLowerCase()].details.version === '';
        if(!isNeo4jUp) {
            this.setValidationMessage(t('FORM.VALIDATION_MESSAGES.NEO4j_DOWN'));
        }
        if(isOCVersionUnknown) {
            this.setValidationMessage(t('FORM.VALIDATION_MESSAGES.UNKNOWN_OC_VERSION'));
        }
        this.startCheckingResetFiles = true;
        checkResetFiles();
    }

    render(){
        const {validationMessage} = this.state;
        const {t, systemRequirements} = this.props;
        const VISIBLE_SERVICES = ['db', 'elasticsearch', 'neo4j', OC_NAME.toLowerCase(), 'os'];
        const backupLogLink = 'https://docs.opencelium.io/en/prod/gettinginvolved/administration.html';
        const backupLinkText = t('FORM.BACKUP_LINK_TEXT');
        return(
            <Container style={{position: 'unset'}}>
                {
                    systemRequirements &&
                    <div style={{marginTop: '10px'}}>
                        {
                            Object.entries(systemRequirements.details).map(line => {
                                if (VISIBLE_SERVICES.indexOf(line[0]) !== -1) {
                                    let stringData = line[1].status === APP_STATUS_DOWN ? t('FORM.SERVICE_IS_DOWN') : line[1].details.name ? line[1].details.name : line[1].details.version;
                                    if (line[0] === OC_NAME.toLowerCase() && line[1].details.version === '') {
                                        stringData = t('FORM.UNKNOWN_OC_VERSION');
                                    }
                                    return (
                                        <Row key={line[0]}>
                                            <Col md={3}>{line[0]}</Col>
                                            <Col md={9}>{stringData}</Col>
                                        </Row>
                                    );
                                }
                            })
                        }
                    </div>
                }
                <div className={styles.system_overview}>
                    <span className={styles.hint}>
                        {`Hint: `}
                    </span>
                    <Translate i18nKey="update_assistant:FORM.BACKUP_MESSAGE"
                               values={{backupLinkText}}
                               components={[
                                   <a href={backupLogLink} target={'_blank'} children={backupLinkText}/>
                               ]}/>
                </div>
                {validationMessage && <span className={`${theme.error} ${basicComponentsStyles.input_error}`} style={{textAlign: 'center', width: '100%',paddingRight: '30px'}}>{validationMessage}</span>}
            </Container>
        );
    }
}

export default SystemOverview;
