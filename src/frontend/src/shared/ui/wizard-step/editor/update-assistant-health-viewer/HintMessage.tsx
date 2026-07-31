import { Trans } from 'react-i18next';
import React from 'react';
import {Hint} from "@shared/ui/primitives/Hint";

const HintMessage = () => {
    return (
        <Hint type="warning">
            <Trans i18nKey="update-assistant.health.hint" ns="entity">
                {"Please, do not forget to create a backup of the system, before you start the update (see "}
                <a
                    href="https://docs.opencelium.io/en/prod/gettinginvolved/administration.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    docs
                </a>
                {")."}
            </Trans>
        </Hint>
    );
};

export default HintMessage;
