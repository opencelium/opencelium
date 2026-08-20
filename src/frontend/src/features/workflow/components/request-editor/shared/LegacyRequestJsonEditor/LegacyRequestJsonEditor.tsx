import { ConfigProvider } from 'antd';
import { useMethodContext } from '../../../../providers/MethodContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Collapse } from '@shared/ui/primitives/Collapse';
import type { CollapseItem } from '@shared/ui/primitives/Collapse/Collapse.types';
import { Empty } from '@shared/ui/primitives/Empty';
import { useRequestObjectEditor } from '../useRequestObjectEditor';
import ReferenceEnhancement from '../../enhancement/Enhancement/Enhancement';
import { ReferenceInfo } from '../../reference-info/ReferenceInfo/ReferenceInfo';
import { LegacyRequestData } from './LegacyRequestData';
import { useLegacyJsonComponents } from './useLegacyJsonComponents';
import type { LegacyRequestJsonEditorProps } from './LegacyRequestJsonEditor.types';
import '../../body-editor/bodyLegacy.css';

export function LegacyRequestJsonEditor(props: LegacyRequestJsonEditorProps) {
	const { messageProperty, source, readOnly } = props;
	const { method } = useMethodContext();
	const { t } = useI18n('workflow');
	const editor = useRequestObjectEditor({ messageProperty, source });
	const components = useLegacyJsonComponents({ ...props, methodId: method.id, editor });
	const hasReferences = !!editor.connection?.fieldBindings.some((binding) => {
		const result = binding.enhancement?.args?.RESULT_VAR;
		return typeof result === 'string'
			&& result.startsWith(`${method.color}.(request).${messageProperty}.$`);
	});
	const items: CollapseItem[] = [
		{ key: 'referenceInfo', label: t('referenceInfo.legacyTitle'),
			content: hasReferences ? <ReferenceInfo messageProperty={messageProperty} data={{}}
				readOnly={readOnly} onReferenceClick={editor.setSelectedEnhanceId}
				onDeleteReference={editor.deleteReferenceAtPath} />
				: <Empty description={t('referenceInfo.empty')} /> },
		{ key: 'requestData', label: t('requestData'), content: <LegacyRequestData {...props}
			editor={editor} {...components} /> },
	];
	return <div className='bodyLegacyLayout'>
		<div className='bodyLegacyLeftPane'><div className='bodyLegacyLeft'>
			<ConfigProvider theme={{ token: { motion: false } }}>
				<Collapse className='bodyLegacyLeftCollapse' items={items}
					defaultActiveKeys={['requestData']} />
			</ConfigProvider>
		</div></div>
		<div className='bodyLegacyEnhancementPane'><div className='bodyLegacyEnhancement'>
			<ReferenceEnhancement readOnly={readOnly} enhancement={editor.currentEnhancement}
				directReference={editor.directReference} onCreateEnhancement={editor.createEnhancement}
				onDeleteEnhancement={editor.deleteEnhancement} />
		</div></div>
	</div>;
}
