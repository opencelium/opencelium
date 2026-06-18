/* eslint-disable react-hooks/set-state-in-effect */
import { Select } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MethodWithId } from '../../../types/connection';
import { getReferenceOptions, isExpandableReferencePath, type ResponseType } from './requestReferenceOptions';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  method?: MethodWithId;
  type: ResponseType;
  value?: string;
  disabled?: boolean;
  iterators?: string[];
  onChange: (value?: string) => void;
};

const normalizeSelectPath = (value?: string) => {
  if (value === '$.') return '$';
  return value || '';
};

export function LegacyResponseFieldSelect({ method, type, value, disabled, iterators = [], onChange }: Props) {
  const { t } = useI18n('workflow');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectingRef = useRef(false);
  const userInteractionRef = useRef(false);
  const [path, setPath] = useState(normalizeSelectPath(value));
  const [optionsBase, setOptionsBase] = useState('');
  const [open, setOpen] = useState(false);
  const displayPath = path === '$' ? t('references.rootObject') : path;

  useEffect(() => {
    const nextPath = normalizeSelectPath(value);
    setPath(nextPath);
    setOptionsBase(nextPath);
  }, [iterators, method, type, value]);

  const options = useMemo(
    () =>
      getReferenceOptions(method, type, optionsBase, iterators, t).map((item) => ({
        label: item.label,
        value: item.value,
      })),
    [iterators, method, optionsBase, type, t],
  );

  const focusInputToEnd = () => {
    requestAnimationFrame(() => {
      const input = wrapperRef.current?.querySelector('input');
      if (!(input instanceof HTMLInputElement)) return;
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  };

  return (
    <div
      ref={wrapperRef}
      onMouseDownCapture={() => {
        userInteractionRef.current = true;
      }}
      onKeyDownCapture={() => {
        userInteractionRef.current = true;
      }}
    >
      <Select
        placeholder={type === 'status' ? t('references.responseStatus') : method ? t('placeholders.selectField') : t('placeholders.selectMethod')}
        value={undefined}
        searchValue={type === 'status' ? 'status' : displayPath}
        className='bodyLegacyGeneratorSelect'
        disabled={disabled || type === 'status'}
        showSearch
        filterOption={false}
        getPopupContainer={() => document.body}
        styles={{ popup: { root: { zIndex: 13010 } } }}
        options={options}
        notFoundContent={path ? null : undefined}
        open={disabled || type === 'status' || (open && path && options.length === 0) ? false : open}
        onSearch={(nextValue) => {
          if (!userInteractionRef.current) return;
          if (selectingRef.current) {
            selectingRef.current = false;
            return;
          }
          const nextPath = normalizeSelectPath(nextValue);
          setPath(nextPath);
          onChange(nextPath || undefined);
          setOptionsBase(nextPath);
          setOpen(userInteractionRef.current);
        }}
        onSelect={(nextValue) => {
          selectingRef.current = true;
          const nextPath = normalizeSelectPath(String(nextValue || ''));
          setPath(nextPath);
          onChange(nextPath || undefined);
          const expandable = isExpandableReferencePath(method, type, nextPath, iterators);
          if (expandable) {
            setOptionsBase(nextPath);
            setOpen(true);
            focusInputToEnd();
            return;
          }
          setOpen(false);
        }}
        onFocus={() => {
          if (!userInteractionRef.current) return;
          setOpen(true);
          focusInputToEnd();
        }}
        onBlur={() => {
          requestAnimationFrame(() => {
            userInteractionRef.current = false;
            setOpen(false);
          });
        }}
        onClear={() => {
          setPath('');
          setOptionsBase('');
          onChange(undefined);
        }}
        allowClear
      />
    </div>
  );
}
