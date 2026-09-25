import { useEffect, useRef, useState } from 'react';
import { DebounceDelay } from '../../../../constants/constants';

export function useEnhancementScriptValue(
  script: string,
  onChangeScript: (value: string) => void,
) {
  const [value, setValue] = useState(script);
  // Callers build this inline, so its identity changes on every render — keeping
  // it out of the effect's deps stops that from re-running (and re-scheduling)
  // the debounce on renders where nothing was actually typed.
  const onChangeScriptRef = useRef(onChangeScript);

  useEffect(() => {
    onChangeScriptRef.current = onChangeScript;
  }, [onChangeScript]);

  useEffect(() => setValue(script), [script]);

  useEffect(() => {
    if (value === script) return;
    const timeout = setTimeout(() => onChangeScriptRef.current(value), DebounceDelay);
    return () => clearTimeout(timeout);
  }, [script, value]);

  return [value, setValue] as const;
}
