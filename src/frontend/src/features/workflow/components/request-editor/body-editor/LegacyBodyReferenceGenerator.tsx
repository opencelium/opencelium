import { ApiOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import { useMemo, useState } from 'react';
import type { Connection, MethodWithId } from '../../../types/connection';
import { buildReferenceValue, getIteratorsForMethod, getMethodConnectorIcon, getMethodConnectorTitle, type ResponseType } from './requestReferenceOptions';
import { LegacyWebhookReferenceSelect } from './LegacyWebhookReferenceSelect';
import { LegacyResponseFieldSelect } from './LegacyResponseFieldSelect';
import { webhookSnippet } from './bodyWebhook';
import { Radio } from '@shared/ui/primitives/Radio';
import { ConnectorIcon } from '@entities/connector/ui/ConnectorIcon';
import { MethodColorDot } from '../../MethodColorDot';
import { getDuplicateMethodIndexByColor } from '../../../utils/methodColor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import './bodyLegacy.css';

type Props = {
  connection: Connection;
  currentMethod: MethodWithId;
  onApply: (reference: string) => void;
  showWebhookOption?: boolean;
};

type WorkflowEdgeLike = {
  source?: string;
  target?: string;
};

const getWorkflowEdges = (connection: Connection): WorkflowEdgeLike[] => {
  const ui = connection.ui as any;
  if (Array.isArray(ui?.workflowEdges)) return ui.workflowEdges;
  if (Array.isArray(ui?.flowchartEdges)) return ui.flowchartEdges;
  return [];
};

const getUpstreamNodeIds = (currentMethodId: string, edges: WorkflowEdgeLike[]) => {
  const sourcesByTarget = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!edge.source || !edge.target) return;
    sourcesByTarget.set(edge.target, [...(sourcesByTarget.get(edge.target) ?? []), edge.source]);
  });

  const upstream = new Set<string>();
  const queue = [...(sourcesByTarget.get(currentMethodId) ?? [])];

  while (queue.length) {
    const nodeId = queue.shift();
    if (!nodeId || upstream.has(nodeId)) continue;
    upstream.add(nodeId);
    queue.push(...(sourcesByTarget.get(nodeId) ?? []));
  }

  return upstream;
};

export function LegacyBodyReferenceGenerator({ connection, currentMethod, onApply, showWebhookOption = true }: Props) {
  const { t } = useI18n('workflow');
  const [referenceType, setReferenceType] = useState<'direct' | 'webhook'>('direct');
  const [responseType, setResponseType] = useState<ResponseType>('body');
  const [methodId, setMethodId] = useState<string>();
  const [field, setField] = useState<string>();
  const [webhookValue, setWebhookValue] = useState<string>();

  const methods = useMemo(() => {
    const workflowEdges = getWorkflowEdges(connection);
    if (workflowEdges.length > 0) {
      const upstreamNodeIds = getUpstreamNodeIds(currentMethod.id, workflowEdges);
      return connection.fromConnector.method.filter(
        (method) => method.id !== currentMethod.id && upstreamNodeIds.has(method.id),
      );
    }

    return connection.fromConnector.method
      .filter((method) => method.id !== currentMethod.id && Number(method.index) < Number(currentMethod.index));
  }, [connection, currentMethod.index, currentMethod.id]);

  const selectedMethod = methods.find((method) => method.id === methodId);
  const duplicateIndexByColor = useMemo(
    () => getDuplicateMethodIndexByColor(connection.fromConnector.method),
    [connection],
  );
  const currentMethodIterators = useMemo(
    () => getIteratorsForMethod(connection, currentMethod),
    [connection, currentMethod],
  );
  const shellClassName = [
    'bodyLegacyGeneratorShell',
    referenceType === 'webhook' ? 'bodyLegacyGeneratorShellWebhook' : '',
    !showWebhookOption ? 'bodyLegacyGeneratorShellNoToggle' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClassName}>
      {showWebhookOption ? (
        <div className='bodyLegacyGeneratorSwitch compactRadioGroup'>
          <Radio
            checked={referenceType === 'direct'}
            onChange={() => setReferenceType('direct')}
            label={<span className='bodyLegacyRadioIcon'><ApiOutlined /></span>}
          />
          <Radio
            checked={referenceType === 'webhook'}
            onChange={() => setReferenceType('webhook')}
            label={<span className='bodyLegacyRadioIcon'><LinkOutlined /></span>}
          />
        </div>
      ) : null}
      {referenceType === 'direct' ? (
        <>
          <Select
            placeholder={t('placeholders.selectMethod')}
            value={methodId}
            className='bodyLegacyGeneratorSelect'
            size='large'
            showSearch
            filterOption={(input, option) => {
              const term = input.toLowerCase();
              const data = option as { label?: unknown; connectorTitle?: string };
              return (
                String(data?.label ?? '').toLowerCase().includes(term) ||
                String(data?.connectorTitle ?? '').toLowerCase().includes(term)
              );
            }}
            prefix={selectedMethod ? (
              <span title={getMethodConnectorTitle(selectedMethod)} style={{ display: 'inline-flex' }}>
                <ConnectorIcon icon={getMethodConnectorIcon(selectedMethod)} size={18} />
              </span>
            ) : undefined}
            onChange={(value) => {
              setMethodId(value);
              setField(undefined);
            }}
            options={methods.map((method) => ({
              label: method.label || method.name,
              value: method.id,
              connectorTitle: getMethodConnectorTitle(method),
              connectorIcon: getMethodConnectorIcon(method),
              color: method.color,
              dupIndex: method.color ? duplicateIndexByColor.get(method.color.toLowerCase()) : undefined,
            }))}
            optionRender={(option) => {
              const data = option.data as { connectorTitle?: string; connectorIcon?: string | null; color?: string; dupIndex?: number };
              return (
                <span style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <MethodColorDot color={data.color} index={data.dupIndex} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.label}</span>
                  </span>
                  <span title={data.connectorTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: '0 0 auto', maxWidth: '50%', color: 'var(--color-text-secondary)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <ConnectorIcon icon={data.connectorIcon} size={16} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.connectorTitle}</span>
                  </span>
                </span>
              );
            }}
            getPopupContainer={() => document.body}
            popupMatchSelectWidth={320}
            styles={{ popup: { root: { zIndex: 13010 } } }}
          />
          <div className='bodyLegacyGeneratorResponse compactRadioGroup'>
            <Radio
              checked={responseType === 'body'}
              onChange={() => { setResponseType('body'); setField(undefined); }}
              label={<span className='bodyLegacyRadioIcon'>B</span>}
            />
            <Radio
              checked={responseType === 'header'}
              onChange={() => { setResponseType('header'); setField(undefined); }}
              label={<span className='bodyLegacyRadioIcon'>H</span>}
            />
            <Radio
              checked={responseType === 'status'}
              onChange={() => { setResponseType('status'); setField('status'); }}
              label={<span className='bodyLegacyRadioIcon'>S</span>}
            />
          </div>
          <LegacyResponseFieldSelect
            method={selectedMethod}
            type={responseType}
            value={field}
            disabled={!methodId}
            iterators={currentMethodIterators}
            onChange={setField}
          />
          <Button
            type='text'
            className='bodyLegacyGeneratorAction'
            icon={<PlusOutlined />}
            disabled={!selectedMethod || !field}
            onClick={() => {
              if (!(selectedMethod && field)) return;
              onApply(buildReferenceValue(selectedMethod.color, responseType, field));
              setField(undefined);
            }}
          />
        </>
      ) : (
        <>
          <LegacyWebhookReferenceSelect value={webhookValue} onChange={setWebhookValue} />
          <Button
            type='text'
            className='bodyLegacyGeneratorAction'
            icon={<PlusOutlined />}
            disabled={!webhookValue}
            onClick={() => {
              if (!webhookValue) return;
              onApply(webhookSnippet(webhookValue));
              setWebhookValue(undefined);
            }}
          />
        </>
      )}
    </div>
  );
}
