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

import React from "react";
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import { Row, Col, Container } from "react-grid-system";
import {fetchSystemRequirements} from "@actions/update_assistant/fetch";
import {ListComponent} from "@decorators/ListComponent";
import styles from "@themes/default/content/update_assistant/main";
import Translate from "@components/general/app/Translate";


function mapStateToProps(state){
    const auth = state.get('auth');
    const updateAssistant = state.get('update_assistant');
    return{
        authUser: auth.get('authUser'),
        fetchingSystemRequirements: updateAssistant.get('fetchingSystemRequirements'),
        systemRequirements: updateAssistant.get('systemRequirements'),
    }
}

@withTranslation('update_assistant')
@connect(mapStateToProps, {fetchSystemRequirements})
@ListComponent('systemRequirements')
class SystemOverview extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const {entity, updateEntity, systemRequirements} = this.props;
        entity.systemRequirements = systemRequirements;
        updateEntity(entity);
    }

    render(){
        const {t, systemRequirements} = this.props;
        const backupLogLink = 'https://docs.opencelium.io/en/prod/gettinginvolved/administration.html';
        const backupLinkText = t('FORM.FINISH.BACKUP_LINK_TEXT');
        return(
            <Container>
                {
                    Object.entries(systemRequirements.details).map(line => {
                        return(
                            <Row key={line[0]}>
                                <Col md={3}>{line[0]}</Col><Col md={9}>{line[1].details.version}</Col>
                            </Row>
                        )
                    })
                }
                <div className={styles.system_overview}>
                    <span className={styles.hint}>
                        {`Hint: `}
                    </span>
                    <Translate i18nKey="update_assistant:FORM.FINISH.BACKUP_MESSAGE"
                               values={{backupLinkText}}
                               components={[
                                   <a href={backupLogLink} target={'_blank'} children={backupLinkText}/>
                               ]}/>
                </div>
            </Container>
        );
    }
}

export default SystemOverview;
