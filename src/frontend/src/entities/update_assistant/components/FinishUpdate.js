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
import {withTranslation} from "react-i18next";
import styles from "@entity/connection/components/themes/default/content/update_assistant/main";
import Button from "@basic_components/buttons/Button";
import Translate from "@entity/connection/components/components/general/app/Translate";


@withTranslation('update_assistant')
class FinishUpdate extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {t, updateSystem, entity} = this.props;
        const updateLogLink = 'https://docs.opencelium.io/en/prod/gettinginvolved/administration.html';
        const restoreLinkText = t('FORM.FINISH.RESTORE_LINK_TEXT');
        return(
            <div className={styles.finish_update}>
                <div className={styles.header}>{t('FORM.FINISH.HEADER')}</div>
                <div dangerouslySetInnerHTML={{__html: entity.availableUpdates.selectedVersion?.instructions || ''}}/>
                <div className={styles.hint}><span>{t('FORM.FINISH.HINT')}</span>: {t('FORM.FINISH.CLEAR_CACHE')}</div>
                <Button
                    style={{float: 'right'}}
                    onClick={() => updateSystem(entity)}
                    title={t('FORM.UPDATE_OC')}
                />
            </div>
        );
    }
}

export default FinishUpdate;
