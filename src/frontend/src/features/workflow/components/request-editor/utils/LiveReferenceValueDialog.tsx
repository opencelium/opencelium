import type React from 'react';
import ReactJson from 'react-json-view';
import { message } from 'antd';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { DialogHeaderActions } from '@shared/ui/primitives/Dialog/DialogHeaderSlotContext';
import { Button } from '@shared/ui/primitives/Button';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { copyToClipboard } from '@shared/utils/copyToClipboard';

const PatchedReactJson = ReactJson as unknown as React.ComponentType<Record<string, unknown>>;

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  value: unknown;
};

// Full-value counterpart to the truncated hover tooltip (see
// LiveReferenceValuePreview) — objects/arrays render through the same
// react-json-view instance ResponseDialog uses, everything else as plain text.
export function LiveReferenceValueDialog({ open, onClose, label, value }: Props) {
  const { t: tWorkflow } = useI18n('workflow');
  const { themeMode } = useTheme();
  const isJson = value !== null && typeof value === 'object';

  const handleCopy = async () => {
    const text = isJson ? JSON.stringify(value, null, 2) : String(value);
    const copied = await copyToClipboard(text);
    if (copied) message.success(tWorkflow('references.valueDialog.copySuccess'));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={label}
      width={720}
      testId="workflow-reference-value-dialog"
      footer={
        <Button type="primary" onClick={onClose} testId="workflow-reference-value-dialog-close">
          {tWorkflow('actions.close')}
        </Button>
      }
    >
      <DialogHeaderActions>
        <Tooltip content={tWorkflow('references.valueDialog.copyTooltip')}>
          <IconButton
            iconProps={{ name: 'content-copy' }}
            size="xs"
            type="text"
            onClick={handleCopy}
            testId="workflow-reference-value-dialog-copy"
          />
        </Tooltip>
      </DialogHeaderActions>
      {/* Fixed height with its own scrollbar — a fully-expanded json-view or a
          very long string must never grow the modal past the viewport and
          force the page itself to scroll. */}
      <div
        style={{ height: 480, overflowY: 'auto', paddingRight: 4 }}
        // This dialog is opened from inside a reference chip's hover tooltip
        // (see LiveReferenceValuePreview), so — via React's portal-transparent
        // event bubbling — every click here would otherwise also reach the
        // chip's own onClick/onMouseDown handlers (row selection, cursor
        // insertion, etc.), which react by re-rendering/remounting the chip
        // tree and wipe out react-json-view's own per-node expand state.
        // Stopping propagation here keeps every click (including expand/
        // collapse toggles) local to the dialog.
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {isJson ? (
          <PatchedReactJson
            name={false}
            src={value as Record<string, unknown>}
            collapsed={true}
            enableClipboard={false}
            displayDataTypes={false}
            displayObjectSize={false}
            onEdit={false}
            onAdd={false}
            onDelete={false}
            theme={themeMode === 'dark' ? 'twilight' : 'rjv-default'}
            style={{ background: 'transparent', fontSize: 13, wordBreak: 'break-word', padding: '4px 0' }}
          />
        ) : (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13 }}>{String(value)}</pre>
        )}
      </div>
    </Dialog>
  );
}
