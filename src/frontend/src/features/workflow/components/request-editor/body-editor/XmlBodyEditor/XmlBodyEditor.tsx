import { ConfigProvider } from 'antd';
import ReferenceEnhancement from '../../enhancement/Enhancement/Enhancement';
import { ReferenceInfo } from '../../reference-info/ReferenceInfo/ReferenceInfo';
import { Collapse } from '@shared/ui/primitives/Collapse';
import type { CollapseItem } from '@shared/ui/primitives/Collapse/Collapse.types';
import { Empty } from '@shared/ui/primitives/Empty';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { InlineBodyReferenceEditor } from '../InlineBodyReferenceEditor/InlineBodyReferenceEditor';
import { useXmlBodyEditor } from '../xml/useXmlBodyEditor';
import { XmlRequestData } from './XmlRequestData';
import type { XmlBodyEditorProps } from './XmlBodyEditor.types';
import '../bodyLegacy.css';

export function XmlBodyEditor({ readOnly }: XmlBodyEditorProps) {
	const { t } = useI18n('workflow');
	const editor = useXmlBodyEditor();
	const hasReferenceInfo = !!editor.connection?.fieldBindings.some((binding) => {
		const result = binding.enhancement?.args?.RESULT_VAR;
		return typeof result === 'string' && result.startsWith(`${editor.method.color}.(request).body.$`);
	});
	const leftItems: CollapseItem[] = [
		{ key: 'referenceInfo', label: t('referenceInfo.legacyTitle'),
			content: hasReferenceInfo ? <ReferenceInfo messageProperty='body' data={{}}
				onReferenceClick={editor.setSelectedEnhanceId} />
				: <Empty description={t('referenceInfo.empty')} /> },
		{ key: 'requestData', label: t('requestData'),
			content: <XmlRequestData readOnly={readOnly} editor={editor} /> },
	];
	return <>
		<div className='bodyLegacyLayout'>
			<div className='bodyLegacyLeftPane'><div className='bodyLegacyLeft'>
				<ConfigProvider theme={{ token: { motion: false } }}>
					<Collapse className='bodyLegacyLeftCollapse' items={leftItems} defaultActiveKeys={['requestData']} />
				</ConfigProvider>
			</div></div>
			<div className='bodyLegacyEnhancementPane'><div className='bodyLegacyEnhancement'>
				<ReferenceEnhancement readOnly={readOnly} enhancement={editor.currentEnhancement}
					directReference={editor.directReference} onCreateEnhancement={editor.createEnhancement} />
			</div></div>
		</div>
		{editor.connection && editor.isReferenceOpen && (
			<InlineBodyReferenceEditor referenceId={`${editor.method.id}_body_xml_reference`}
				connection={editor.connection} currentMethod={editor.method}
				submitEdit={() => {
					const reference = document.getElementById(`${editor.method.id}_body_xml_reference`)?.innerText;
					if (reference) editor.insertReference(reference);
				}}
				onClose={() => editor.setIsReferenceOpen(false)} />
		)}
	</>;
}
