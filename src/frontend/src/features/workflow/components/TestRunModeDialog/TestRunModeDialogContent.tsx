import { useEffect, useState } from 'react';
import { Button } from '@shared/ui/primitives/Button';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { Typography } from '@shared/ui/primitives/Typography';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { TestRunMode } from '../../test-run/testRunModePreference';
import { useTestRunModePromptStore } from '../../test-run/testRunModePromptStore';

type TestRunModeDialogContentProps = {
	// Called with the picked mode and whether this dialog should stop being
	// shown from now on — the caller both starts the run and persists the
	// preference, so the two can never disagree.
	onStart: (mode: TestRunMode, suppressPrompt: boolean) => void;
};

const BULLET_KEYS = ['backendSpeed', 'speedAdjustable', 'switchToLive'] as const;

export function TestRunModeDialogContent({ onStart }: TestRunModeDialogContentProps) {
	const { t: tEntities } = useI18n('entities');
	const [suppressPrompt, setSuppressPrompt] = useState(false);
	const setPromptOpen = useTestRunModePromptStore((state) => state.setOpen);

	// Points the logs header's Live toggle out while this is on screen — see
	// testRunModePromptStore.ts for why it is a store and not a prop.
	useEffect(() => {
		setPromptOpen(true);
		return () => setPromptOpen(false);
	}, [setPromptOpen]);

	return (
		<div>
			<Typography variant='headline' as='h2'>{tEntities('connection.test.modeDialog.title')}</Typography>
			<Typography variant='body'>{tEntities('connection.test.modeDialog.intro')}</Typography>
			<ul style={{ margin: '12px 0 0', paddingLeft: 20, display: 'grid', gap: 6 }}>
				{BULLET_KEYS.map((key) => (
					<li key={key}>
						<Typography variant='body'>{tEntities(`connection.test.modeDialog.${key}`)}</Typography>
					</li>
				))}
			</ul>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
				<Checkbox
					label={tEntities('connection.test.modeDialog.dontShowAgain')}
					checked={suppressPrompt}
					onChange={setSuppressPrompt}
					testId='workflow-test-run-mode-dont-show-again'
				/>
				<div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
					<Button type='primary' onClick={() => onStart('debug', suppressPrompt)}
						testId='workflow-test-run-mode-start-debug'>
						{tEntities('connection.test.modeDialog.startDebug')}
					</Button>
					<Button onClick={() => onStart('live', suppressPrompt)}
						testId='workflow-test-run-mode-start-live'>
						{tEntities('connection.test.modeDialog.startLive')}
					</Button>
				</div>
			</div>
		</div>
	);
}
