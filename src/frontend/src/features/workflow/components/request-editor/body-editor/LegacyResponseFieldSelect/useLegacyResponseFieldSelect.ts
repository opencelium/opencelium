/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { getReferenceOptions, isExpandableReferencePath } from '../requestReferenceOptions';
import type { LegacyResponseFieldSelectProps } from './LegacyResponseFieldSelect.types';

const normalizePath = (value?: string) => value === '$.' ? '$' : value || '';

export function useLegacyResponseFieldSelect(props: LegacyResponseFieldSelectProps) {
  const { method, type, value, disabled, iterators = [], onChange } = props;
  const { t } = useI18n('workflow');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectingRef = useRef(false);
  const userInteractionRef = useRef(false);
  const [path, setPath] = useState(normalizePath(value));
  const [optionsBase, setOptionsBase] = useState('');
  const [open, setOpen] = useState(false);
  const displayPath = path === '$' ? t('references.rootObject') : path;

  useEffect(() => {
    const nextPath = normalizePath(value);
    setPath(nextPath);
    setOptionsBase(nextPath);
  }, [iterators, method, type, value]);

  const options = useMemo(() => getReferenceOptions(method, type, optionsBase, iterators, t)
    .map(({ label, value: optionValue }) => ({ label, value: optionValue })),
  [iterators, method, optionsBase, type, t]);

  const focusInputToEnd = () => requestAnimationFrame(() => {
    const input = wrapperRef.current?.querySelector('input');
    if (!(input instanceof HTMLInputElement)) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  const updatePath = (nextValue: string) => {
    const nextPath = normalizePath(nextValue);
    setPath(nextPath);
    onChange(nextPath || undefined);
    return nextPath;
  };

  return {
    wrapperRef, userInteractionRef, displayPath, options,
    placeholder: type === 'status' ? t('references.responseStatus')
      : method ? t('placeholders.selectField') : t('placeholders.selectMethod'),
    searchValue: type === 'status' ? 'status' : displayPath,
    isDisabled: disabled || type === 'status',
    open: disabled || type === 'status' || (open && path && options.length === 0) ? false : open,
    notFoundContent: path ? null : undefined,
    onSearch: (nextValue: string) => {
      if (!userInteractionRef.current) return;
      if (selectingRef.current) return void (selectingRef.current = false);
      const nextPath = updatePath(nextValue);
      setOptionsBase(nextPath);
      setOpen(userInteractionRef.current);
    },
    onSelect: (nextValue: unknown) => {
      selectingRef.current = true;
      const nextPath = updatePath(String(nextValue || ''));
      if (isExpandableReferencePath(method, type, nextPath, iterators)) {
        setOptionsBase(nextPath);
        setOpen(true);
        focusInputToEnd();
        return;
      }
      setOpen(false);
    },
    onFocus: () => {
      if (!userInteractionRef.current) return;
      setOpen(true);
      focusInputToEnd();
    },
    onBlur: () => requestAnimationFrame(() => {
      userInteractionRef.current = false;
      setOpen(false);
    }),
    onClear: () => {
      setPath('');
      setOptionsBase('');
      onChange(undefined);
    },
  };
}
