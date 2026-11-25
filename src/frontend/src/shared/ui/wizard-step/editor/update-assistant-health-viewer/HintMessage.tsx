import { Trans } from 'react-i18next';
import {Hint} from "@shared/ui/primitives/Hint";

const HintMessage = () => {
    return (
        <Hint type="warning">
            <Trans i18nKey="entities:update-assistant.health.hint">
                {"Please, do not forget to "}
                <a
                    href="https://docs.opencelium.io/en/prod/operations/backup-and-restore.html"
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
