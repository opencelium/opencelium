import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { PlaygroundSession } from '../hooks/usePlaygroundSession';

type Props = { session: PlaygroundSession };

export function PlaygroundTitle({ session }: Props) {
	const { t } = useI18n('workflow');
	const { baseNode, draft, operatorPath, connector } = session;
	const operatorLabel = ({ type, iterator }: { type: string; iterator?: string }) => {
		if (type !== 'loop') return t('requestPlayground.breadcrumb.if');
		return iterator
			? t('requestPlayground.breadcrumb.loopWithIterator', { iterator })
			: t('requestPlayground.breadcrumb.loop');
	};
	const parts = [
		connector?.title ?? baseNode.data.connector?.title,
		draft.name,
		operatorPath.length
			? t('requestPlayground.breadcrumb.inside', { path: operatorPath.map(operatorLabel).join(' › ') })
			: null,
	].filter((part): part is string => !!part);

	return (
		<div className='rpTitle'>
			<span className='rpTitleText'>{t('requestPlayground.title')}</span>
			<span className='rpBreadcrumb' data-testid='request-playground-breadcrumb'>
				<span className='rpBreadcrumbStep'>{baseNode.data.subtitle || draft.name}</span>
				{parts.map((part, index) => (
					<span key={index} className='rpBreadcrumbPart'>
						<span aria-hidden>·</span>
						<span className={part === draft.name ? 'rpMono' : undefined}>{part}</span>
					</span>
				))}
			</span>
		</div>
	);
}
