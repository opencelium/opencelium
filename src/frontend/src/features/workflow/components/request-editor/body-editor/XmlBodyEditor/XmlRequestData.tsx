import { useRef, useState, type CSSProperties } from 'react';
import { Alert, Card, Input, Segmented, Space, Tag } from 'antd';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { XmlNodeCard } from '../xml/XmlNodeCard/XmlNodeCard';
import { addChildNode, removeNode, updateNode } from '../xml/xmlTree';
import type { useXmlBodyEditor } from '../xml/useXmlBodyEditor';

type Props = {
	readOnly?: boolean;
	editor: ReturnType<typeof useXmlBodyEditor>;
};

export function XmlRequestData({ readOnly, editor }: Props) {
	const { t } = useI18n('workflow');
	const [isMaximized, setIsMaximized] = useState(false);
	const [maximizedStyle, setMaximizedStyle] = useState<CSSProperties>();
	const contentBoxRef = useRef<HTMLDivElement>(null);
	const toggleMaximized = () => {
		setIsMaximized((current) => {
			const next = !current;
			if (next) {
				const body = contentBoxRef.current?.closest('.ant-modal-body') as HTMLElement | null;
				const rect = body?.getBoundingClientRect();
				setMaximizedStyle(rect ? { position: 'fixed', top: rect.top, left: rect.left,
					width: rect.width, height: rect.height } : undefined);
			}
			return next;
		});
		setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
	};
	return (
		<div ref={contentBoxRef}
			className={isMaximized ? 'bodyLegacyXmlContent bodyLegacyXmlContentMaximized' : 'bodyLegacyXmlContent'}
			style={isMaximized ? maximizedStyle : undefined}>
			<div className='bodyLegacyXmlToolbar'>
				<Segmented<'tree' | 'raw'> value={editor.mode} onChange={(mode) => {
					editor.setMode(mode);
					if (mode === 'raw') editor.setRawError(null);
				}} options={[{ label: t('xmlBody.tree'), value: 'tree' },
					{ label: t('xmlBody.rawData'), value: 'raw' }]} />
				<Tooltip content={t(isMaximized ? 'actions.minimizeRequestData' : 'actions.maximizeRequestData')}>
					<button type='button' className='logsHeaderIconButton logsHeaderIconButton--active'
						onClick={toggleMaximized}
						aria-label={t(isMaximized ? 'actions.minimizeRequestData' : 'actions.maximizeRequestData')}
						data-testid='workflow-xml-body-fullscreen'>
						{isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
					</button>
				</Tooltip>
			</div>
			{editor.rawError && <Alert type='error' message={editor.rawError} />}
			{editor.mode === 'raw' ? (
				<Card title={t('xmlBody.rawXml')} className='bodyLegacyXmlCard'>
					<Input.TextArea className='xmlRaw bodyLegacyXmlRaw' value={editor.rawXml}
						readOnly={readOnly} spellCheck={false} style={{ fontFamily: 'monospace' }}
						onChange={(event) => { editor.setRawXml(event.target.value); if (editor.rawError) editor.setRawError(null); }}
						onBlur={() => editor.applyRawXml(readOnly)} />
				</Card>
			) : (
				<Card title={t('xmlBody.xmlBody')} className='bodyLegacyXmlCard'
					extra={<Space size={12}>{editor.selectionInfo && <Tag color='blue'>{editor.selectionInfo.label}</Tag>}</Space>}>
					<div className='xmlTreePanel'>
						<XmlNodeCard node={editor.tree} readOnly={readOnly} selected={editor.selection}
							onSelect={editor.setSelection} onReferenceClick={editor.setSelection}
							onInsertReference={(selection) => { editor.setSelection(selection); editor.setIsReferenceOpen(true); }}
							onChangeNode={(id, patch) => { const next = updateNode(editor.tree, id, (node) => ({ ...node, ...patch })); editor.setTree(next); editor.syncBody(next); }}
							onAddChild={(id) => { const next = addChildNode(editor.tree, id); editor.setTree(next); editor.syncBody(next); }}
							onRemove={(id) => { const next = removeNode(editor.tree, id); editor.setTree(next); editor.syncBody(next); }} />
					</div>
				</Card>
			)}
		</div>
	);
}
