import type { ReactNode } from 'react';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Alert } from '@shared/ui/primitives/Alert';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ScriptDebugStatus } from './useScriptDebugValue';
import type { ScriptDebugResult } from './scriptDebugValue.utils';

type Props = {
	status: ScriptDebugStatus;
	snapshot: ScriptDebugResult | null;
};

function Section({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className='scriptDebugValueSection'>
			<div className='scriptDebugValueSectionLabel'>{label}</div>
			{children}
		</div>
	);
}

export function ScriptDebugValueBody({ status, snapshot }: Props) {
	const { t } = useI18n('workflow');

	if (status === 'idle' || !snapshot) {
		return <span style={{ color: 'var(--color-text-secondary)' }}>{t('enhancement.debugValue.idleHint')}</span>;
	}

	if (status === 'loading') {
		return (
			<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
				<Loading size="xs" inline />
				{t('enhancement.debugValue.loadingHint')}
			</span>
		);
	}

	// `stale` still renders the last settled (value/error) snapshot — only the
	// header badge communicates that the script has since changed.
	const references = (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			{snapshot.references.length === 0 ? (
				<span style={{ color: 'var(--color-text-secondary)' }}>{t('enhancement.debugValue.noReferences')}</span>
			) : (
				snapshot.references.map((reference) => (
					<div key={reference.name}>
						<span className='scriptDebugValueRefName'>{reference.name}</span> = {reference.formatted}
					</div>
				))
			)}
		</div>
	);

	if (snapshot.kind === 'error') {
		return (
			<>
				<Section label={t('enhancement.debugValue.references')}>{references}</Section>
				<Alert type="error" showIcon message={t('enhancement.debugValue.errorTitle')} description={t(snapshot.message)} />
			</>
		);
	}

	return (
		<>
			<Section label={t('enhancement.debugValue.references')}>{references}</Section>
			<Section label={t('enhancement.debugValue.resultLabel', { type: snapshot.resultType })}>
				<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-status-success-fg)' }}>
					{snapshot.resultFormatted}
				</pre>
			</Section>
		</>
	);
}
