import ReactJson from 'react-json-view';
import { Alert, Button, Card, Space, Tag } from 'antd';
import ReferenceEnhancement from '../enhancement/Enhancement/Enhancement';
import { ReferenceInfoSection } from '../reference-info/ReferenceInfoSection/ReferenceInfoSection';
import ReferenceGenerator from '../reference-generator/ReferenceGenerator';
import { RequestFieldInspector } from './RequestFieldInspector';
import { useRequestObjectEditor } from './useRequestObjectEditor';

type Props = {
  messageProperty: 'body' | 'header';
  readOnly?: boolean;
  source: Record<string, unknown>;
  title: string;
};

export function RequestObjectEditor({ messageProperty, readOnly, source, title }: Props) {
  const editor = useRequestObjectEditor({ messageProperty, source });

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 620 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ReferenceInfoSection messageProperty={messageProperty} data={{}} onReferenceClick={editor.setSelectedEnhanceId} />
        {editor.validationError ? <Alert type="error" message={editor.validationError} /> : null}
        <Card
          title={title}
          extra={
            <Space size={12}>
              {editor.selection ? <Tag color="blue">{editor.selection.pathLabel}</Tag> : null}
              <Button type="primary" disabled={readOnly || !editor.selection} onClick={() => editor.setIsReferenceOpen(true)}>
                Insert reference
              </Button>
            </Space>
          }
          style={{ borderRadius: 12, flex: 1 }}
          styles={{ body: { overflow: 'auto', maxHeight: 540 } }}
        >
          <ReactJson
            name={false}
            collapsed={false}
            src={source}
            onSelect={editor.onSelect}
            onEdit={readOnly ? false : editor.syncSource}
            onDelete={readOnly ? false : editor.syncSource}
            onAdd={readOnly ? false : editor.syncSource}
            style={{ wordBreak: 'break-word', padding: '8px 0', background: 'transparent', fontSize: 13 }}
          />
        </Card>
        <RequestFieldInspector
          title="Field inspector"
          selection={editor.selection}
          value={editor.currentValue}
          readOnly={readOnly}
          onInsertReference={() => editor.setIsReferenceOpen(true)}
          onClear={() => editor.updateSelectionValue('')}
          onChangeReferences={editor.updateSelectionValue}
        />
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
