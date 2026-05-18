import { Alert, Card, Input, Segmented, Space, Tag } from 'antd';
import ReferenceEnhancement from '../enhancement/Enhancement';
import { ReferenceInfoSection } from '../reference-info/ReferenceInfoSection';
import ReferenceGenerator from '../reference-generator/ReferenceGenerator';
import { XmlNodeCard } from './xml/XmlNodeCard';
import { addChildNode, removeNode, updateNode } from './xml/xmlTree';
import { useXmlBodyEditor } from './xml/useXmlBodyEditor';

type Props = { readOnly?: boolean };

export function XmlBodyEditor({ readOnly }: Props) {
  const editor = useXmlBodyEditor();

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 620 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 12 }}>
      <ReferenceInfoSection messageProperty="body" data={{}} onReferenceClick={editor.setSelectedEnhanceId} />
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
            { label: 'Tree', value: 'tree' },
            { label: 'Raw data', value: 'raw' },
          ]}
        />
      </Space>
      {editor.rawError ? <Alert style={{ marginBottom: 12 }} type="error" message={editor.rawError} /> : null}
      {editor.mode === 'raw' ? (
        <Card title="Raw XML" style={{ borderRadius: 12 }}>
          <Input.TextArea
            className="xmlRaw"
            value={editor.rawXml}
            readOnly={readOnly}
            autoSize={{ minRows: 18, maxRows: 24 }}
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
          title="XML body"
          extra={
            <Space size={12}>
              {editor.selectionInfo ? <Tag color="blue">{editor.selectionInfo.label}</Tag> : null}
            </Space>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { display: 'grid', gap: 12, maxHeight: 560, overflow: 'auto' } }}
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
      <ReferenceEnhancement readOnly={readOnly} enhancement={editor.currentEnhancement} />
      {editor.connection ? (
        <ReferenceGenerator
          open={editor.isReferenceOpen}
          connection={editor.connection}
          currentMethod={editor.method}
          onClose={() => editor.setIsReferenceOpen(false)}
          onApply={editor.insertReference}
        />
      ) : null}
    </div>
  );
}
