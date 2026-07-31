import { CloseOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { getParsedReferences, splitReferences } from '../bodyReference';

type Props = {
  value: string;
  onChange: (next: string) => void;
  onClick?: () => void;
  readOnly?: boolean;
};

const getLabel = (reference: string) => {
  const parsed = getParsedReferences(reference)[0];
  if (!parsed) return reference;
  if (parsed.field === 'status') return 'Response Status';
  if (parsed.field.startsWith('body.')) return `B:${parsed.field.replace(/^body\.\$?\./, '')}`;
  if (parsed.field.startsWith('header.')) return `H:${parsed.field.replace(/^header\.\$?\./, '')}`;
  return parsed.field;
};

export function XmlReferenceTokens({ value, onChange, onClick, readOnly }: Props) {
  const confirm = useConfirm();
  const { t: tWorkflow } = useI18n('workflow');
  const refs = splitReferences(value);
  if (!refs.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {refs.map((reference, index) => {
        const parsed = getParsedReferences(reference)[0];
        return (
          <Tag
            key={`${reference}-${index}`}
            color={parsed?.color || 'blue'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: onClick ? 'pointer' : 'default', marginInlineEnd: 0 }}
            onClick={onClick}
          >
            <span>{getLabel(reference)}</span>
            {!readOnly ? (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={async (event) => {
                  event.stopPropagation();
                  const ok = await confirm({
                    title: tWorkflow('references.confirmDelete.title'),
                    message: tWorkflow('references.confirmDelete.message'),
                  });
                  if (!ok) return;
                  const next = refs.filter((_, current) => current !== index).join('; ');
                  onChange(next);
                }}
                style={{ width: 16, height: 16, minWidth: 16, padding: 0, color: 'inherit' }}
              />
            ) : null}
          </Tag>
        );
      })}
    </div>
  );
}
