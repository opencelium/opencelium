import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Empty } from '@shared/ui/primitives/Empty';
import { Hint } from '@shared/ui/primitives/Hint';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import ReferenceEnhancement from '../../components/request-editor/enhancement/Enhancement/Enhancement';
import { MethodProvider } from '../../providers/MethodContext';
import type { RootState } from '../../store';
import { describeBinding, logFieldBinding } from '../../utils/fieldBindingDebug';

type BindingDrawerEditorProps = {
	enhanceId: string;
	consumerNodeId: string;
	readOnly?: boolean;
	onDeleteEnhancement?: () => void;
};

/**
 * Inside the drawer's own store: the enhancement has to be read from there, not
 * from the page's field bindings, or the editor would not show its own edits
 * until they were published on close.
 */
export function BindingDrawerEditor({ enhanceId, consumerNodeId, readOnly,
	onDeleteEnhancement }: BindingDrawerEditorProps) {
	const { t } = useI18n('workflow');
	const connection = useSelector((state: RootState) => state.connection.connection);
	const enhancement = connection?.fieldBindings
		.find((binding) => binding.enhancement?.enhanceId === enhanceId)?.enhancement;
	const method = connection?.fromConnector.method.find((item) => item.id === consumerNodeId);

	useEffect(() => {
		logFieldBinding('4. what the drawer hands to the editor', {
			lookingFor: enhanceId,
			storeBindings: connection?.fieldBindings?.length ?? 'no connection in the store',
			idsInStore: (connection?.fieldBindings ?? [])
				.map((item) => String(item.enhancement?.enhanceId)).join(','),
			found: !!enhancement,
			...describeBinding(enhancement ? { enhancement } : undefined),
		});
	}, [connection, enhanceId, enhancement]);

	if (!enhancement || !method) {
		return <div className='bindingDrawerEmpty'>
			<Empty description={t('bindingLens.drawerGone')} />
		</div>;
	}

	// An enhancement built in the old UI's simple mode keeps its logic in
	// `simpleCode`, which nothing here reads — so its script box is legitimately
	// blank, and typing into it would replace that logic rather than edit it. Said
	// out loud, because a blank editor otherwise reads as a bug and is a trap.
	const hasLegacySimpleCode = !String(enhancement.script ?? '').trim()
		&& !!(enhancement as { simpleCode?: unknown }).simpleCode;

	return (
		<MethodProvider value={{ method }}>
			{hasLegacySimpleCode && (
				<div className='bindingDrawerNote'>
					<Hint noPrefix>{t('bindingLens.drawerSimpleCode')}</Hint>
				</div>
			)}
			<ReferenceEnhancement
				enhancement={enhancement}
				readOnly={readOnly}
				onDeleteEnhancement={readOnly ? undefined : onDeleteEnhancement}
			/>
		</MethodProvider>
	);
}
