import { Trans } from 'react-i18next';
import {Hint} from "@shared/ui/primitives/Hint";
import { docsUrl } from '@shared/docs/docsUrl';

const HintMessage = () => {
    return (
        <Hint type="warning">
            <Trans i18nKey="entities:update-assistant.health.hint">
                {"Please, do not forget to "}
                <a
                    href={docsUrl('operations/backup-and-restore')}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    create a backup of the system
                </a>
                {" before you start the update."}
            </Trans>
        </Hint>
    );
};

export default HintMessage;
