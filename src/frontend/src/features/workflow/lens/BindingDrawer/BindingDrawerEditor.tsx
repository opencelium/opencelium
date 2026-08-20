import { useSelector } from 'react-redux';
import { Empty } from '@shared/ui/primitives/Empty';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import ReferenceEnhancement from '../../components/request-editor/enhancement/Enhancement/Enhancement';
import { MethodProvider } from '../../providers/MethodContext';
import type { RootState } from '../../store';

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

	if (!enhancement || !method) {
		return <div className='bindingDrawerEmpty'>
			<Empty description={t('bindingLens.drawerGone')} />
		</div>;
	}

	return (
		<MethodProvider value={{ method }}>
			<ReferenceEnhancement
				enhancement={enhancement}
				readOnly={readOnly}
				onDeleteEnhancement={readOnly ? undefined : onDeleteEnhancement}
			/>
		</MethodProvider>
	);
}
