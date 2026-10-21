import { StatusBadge } from '@features/logs';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { PlaygroundRun } from '../../hooks/usePlaygroundSend';
import type { PlaygroundResponse } from '../../model/playground.types';
import { PlaygroundBadge } from '../PlaygroundBadge';
import { formatSize, readJsonRpcErrorCode } from './responseFormat';

type Props = {
	result: Extract<PlaygroundResponse, { kind: 'success' }> | undefined;
	run: PlaygroundRun | null;
};

export function ResponseSummary({ result, run }: Props) {
	const { t } = useI18n('workflow');
	const rpcErrorCode = result ? readJsonRpcErrorCode(result.response.body) : null;

	return (
		<div className='rpResponseSummary'>
			<span className='rpSectionTitle'>{t('requestPlayground.response.title')}</span>
			{result && (
				<>
					<span data-testid='request-playground-status'>
						<StatusBadge status={String(result.response.status)} />
					</span>
					{rpcErrorCode !== null && (
						<PlaygroundBadge tone='danger'>{t('requestPlayground.response.rpcError', { code: rpcErrorCode })}</PlaygroundBadge>
					)}
					<span className='rpChip' data-testid='request-playground-duration'>
						{t('requestPlayground.response.duration', { ms: result.durationMs })}
					</span>
					<span className='rpChip'>{formatSize(result.response.body)}</span>
				</>
			)}
			{run && !!result && (
				<span className='rpHint rpPushEnd'>
					{run.connectionTitle
						? t('requestPlayground.response.runOn', { run: run.number, connection: run.connectionTitle })
						: t('requestPlayground.response.run', { run: run.number })}
				</span>
			)}
		</div>
	);
}
