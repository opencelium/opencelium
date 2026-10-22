import { useState } from 'react';
import type { Connector } from '@entities/connector/model/types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Checkbox } from '@shared/ui/primitives/Checkbox';

type Props = {
	verb: string;
	connector: Connector | undefined;
	// Another connection of the same API definition the user can test against instead.
	alternative: Connector | undefined;
	onSendAnyway: (isConfirmedForSession: boolean) => void;
	onSwitchConnection: (connectorId: number) => void;
	onCancel: () => void;
};

export function PlaygroundWriteWarning({ verb, connector, alternative, onSendAnyway, onSwitchConnection, onCancel }: Props) {
	const { t } = useI18n('workflow');
	const [isConfirmedForSession, setIsConfirmedForSession] = useState(false);

	return (
		<div role='alert' data-testid='request-playground-write-warning'>
			<Alert type='warning' showIcon
				message={connector
					? t('requestPlayground.writeWarning.title', { method: verb, connection: connector.title })
					: t('requestPlayground.writeWarning.titleDirect', { method: verb })}
				description={<div className='rpWarningBody'>
					<span>{t('requestPlayground.writeWarning.message')}</span>
					<div className='rpWarningActions'>
						<Button type='primary' onClick={() => onSendAnyway(isConfirmedForSession)}
							testId='request-playground-send-anyway'>
							{t('requestPlayground.writeWarning.sendAnyway')}
						</Button>
						{alternative && (
							<Button onClick={() => onSwitchConnection(alternative.connectorId)}
								testId='request-playground-switch-connection'>
								{t('requestPlayground.writeWarning.switchTo', { connection: alternative.title })}
							</Button>
						)}
						<Button type='link' onClick={onCancel} testId='request-playground-cancel-send'>
							{t('requestPlayground.writeWarning.cancel')}
						</Button>
						<span className='rpWarningCheckbox'>
							<Checkbox checked={isConfirmedForSession} onChange={setIsConfirmedForSession}
								label={t('requestPlayground.writeWarning.dontAskAgain')}
								testId='request-playground-dont-ask-again' />
						</span>
					</div>
				</div>} />
		</div>
	);
}
