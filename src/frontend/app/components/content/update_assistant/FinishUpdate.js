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
        const {t, updateLogLink} = this.props;
        const logsLinkText = t('FORM.FINISH.LOGS_LINK_TEXT');
        return(
            <div className={styles.finish_update}>
                <div className={styles.header}>{t('FORM.FINISH.HEADER')}</div>
                <div>{t('FORM.FINISH.NEW_VERSION')}</div>
                <Translate i18nKey="update_assistant:FORM.FINISH.LOG_MESSAGE"
                           values={{logsLinkText}}
                           components={[
                               <a href={'#'} onClick={() => history.push(`/${updateLogLink}`)} children={logsLinkText}/>
                           ]}/>
                <div><span className={styles.hint}>{t('FORM.FINISH.HINT')}</span>: {t('FORM.FINISH.CLEAR_CACHE')}</div>
            </div>
        );
    }
}

export default FinishUpdate;