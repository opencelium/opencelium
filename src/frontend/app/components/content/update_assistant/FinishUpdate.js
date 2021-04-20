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
import {withTranslation} from "react-i18next";
import styles from "@themes/default/content/update_assistant/main";
import Translate from "@components/general/app/Translate";
import {history} from "@components/App";


@withTranslation('update_assistant')
class FinishUpdate extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {t} = this.props;
        const updateLogLink = 'https://docs.opencelium.io/en/prod/gettinginvolved/administration.html';
        const logsLinkText = t('FORM.FINISH.LOGS_LINK_TEXT');
        return(
            <div className={styles.finish_update}>
                <div className={styles.header}>{t('FORM.FINISH.HEADER')}</div>
                <div>{t('FORM.FINISH.NEW_VERSION')}</div>
                <Translate i18nKey="update_assistant:FORM.FINISH.LOG_MESSAGE"
                           values={{logsLinkText}}
                           components={[
                               <a href={'#'} onClick={() => history.push(`${updateLogLink}`)} children={logsLinkText}/>
                           ]}/>
                <div><span className={styles.hint}>{t('FORM.FINISH.HINT')}</span>: {t('FORM.FINISH.CLEAR_CACHE')}</div>
            </div>
        );
    }
}

export default FinishUpdate;