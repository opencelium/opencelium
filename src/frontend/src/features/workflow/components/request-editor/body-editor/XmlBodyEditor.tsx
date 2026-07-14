import { Alert, Card, ConfigProvider, Input, Segmented, Space, Tag } from 'antd';
import ReferenceEnhancement from '../enhancement/Enhancement';
import { ReferenceInfo } from '../reference-info/ReferenceInfo';
import { InlineBodyReferenceEditor } from './InlineBodyReferenceEditor';
import { XmlNodeCard } from './xml/XmlNodeCard';
import { addChildNode, removeNode, updateNode } from './xml/xmlTree';
import { useXmlBodyEditor } from './xml/useXmlBodyEditor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Collapse } from '@shared/ui/primitives/Collapse';
import type { CollapseItem } from '@shared/ui/primitives/Collapse/Collapse.types';
import { Empty } from '@shared/ui/primitives/Empty';
import './bodyLegacy.css';

type Props = { readOnly?: boolean };

export function XmlBodyEditor({ readOnly }: Props) {
  const { t } = useI18n('workflow');
  const editor = useXmlBodyEditor();
  const hasReferenceInfo = !!editor.connection?.fieldBindings.some((binding) => {
    const result = binding.enhancement?.args?.RESULT_VAR;
    return typeof result === 'string' && result.startsWith(`${editor.method.color}.(request).body.$`);
  });

  const leftItems: CollapseItem[] = [
    {
      key: 'referenceInfo',
      label: t('referenceInfo.legacyTitle'),
      content: hasReferenceInfo ? (
        <ReferenceInfo messageProperty="body" data={{}} onReferenceClick={editor.setSelectedEnhanceId} />
      ) : (
        <Empty description={t('referenceInfo.empty')} />
      ),
    },
    {
      key: 'requestData',
      label: t('requestData'),
      content: (
        <div className="bodyLegacyXmlContent">
          <Space>
            <Segmented<'tree' | 'raw'>
              value={editor.mode}
              onChange={(nextMode) => {
                editor.setMode(nextMode);
                if (nextMode === 'raw') {
                  editor.setRawError(null);
                }
              }}
              options={[
                { label: t('xmlBody.tree'), value: 'tree' },
                { label: t('xmlBody.rawData'), value: 'raw' },
              ]}
            />
          </Space>
          {editor.rawError ? <Alert type="error" message={editor.rawError} /> : null}
          {editor.mode === 'raw' ? (
            <Card title={t('xmlBody.rawXml')} className="bodyLegacyXmlCard">
              <Input.TextArea
                className="xmlRaw bodyLegacyXmlRaw"
                value={editor.rawXml}
                readOnly={readOnly}
                onChange={(event) => {
                  editor.setRawXml(event.target.value);
                  if (editor.rawError) editor.setRawError(null);
                }}
                onBlur={() => editor.applyRawXml(readOnly)}
                spellCheck={false}
                style={{ fontFamily: 'monospace' }}
              />
            </Card>
          ) : (
            <Card
              title={t('xmlBody.xmlBody')}
              className="bodyLegacyXmlCard"
              extra={
            <Space size={12}>
              {editor.selectionInfo ? <Tag color="blue">{editor.selectionInfo.label}</Tag> : null}
            </Space>
          }
            >
              <div className="xmlTreePanel">
                <XmlNodeCard
                  node={editor.tree}
                  readOnly={readOnly}
                  selected={editor.selection}
                  onSelect={editor.setSelection}
                  onReferenceClick={(nextSelection) => editor.setSelection(nextSelection)}
                  onInsertReference={(nextSelection) => {
                    editor.setSelection(nextSelection);
                    editor.setIsReferenceOpen(true);
                  }}
                  onChangeNode={(nodeId, patch) => {
                    const next = updateNode(editor.tree, nodeId, (node) => ({ ...node, ...patch }));
                    editor.setTree(next);
                    editor.syncBody(next);
                  }}
                  onAddChild={(nodeId) => {
                    const next = addChildNode(editor.tree, nodeId);
                    editor.setTree(next);
                    editor.syncBody(next);
                  }}
                  onRemove={(nodeId) => {
                    const next = removeNode(editor.tree, nodeId);
                    editor.setTree(next);
                    editor.syncBody(next);
                  }}
                />
              </div>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="bodyLegacyLayout">
        <div className="bodyLegacyLeftPane">
          <div className="bodyLegacyLeft">
            <ConfigProvider theme={{ token: { motion: false } }}>
              <Collapse className="bodyLegacyLeftCollapse" items={leftItems} defaultActiveKeys={['requestData']} />
            </ConfigProvider>
          </div>
        </div>
        <div className="bodyLegacyEnhancementPane">
          <div className="bodyLegacyEnhancement">
            <ReferenceEnhancement readOnly={readOnly} enhancement={editor.currentEnhancement} />
          </div>
        </div>
      </div>
      {editor.connection && editor.isReferenceOpen ? (
        <InlineBodyReferenceEditor
          referenceId={`${editor.method.id}_body_xml_reference`}
          connection={editor.connection}
          currentMethod={editor.method}
          submitEdit={() => {
            const element = document.getElementById(`${editor.method.id}_body_xml_reference`);
            const reference = element?.innerText;
            if (reference) editor.insertReference(reference);
          }}
          onClose={() => editor.setIsReferenceOpen(false)}
        />
      ) : null}
    </>
  );
}
