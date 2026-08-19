import { useEffect, useState } from 'react';
import { DebounceDelay } from '../../../../constants/constants';

export function useEnhancementScriptValue(
  script: string,
  onChangeScript: (value: string) => void,
) {
  const [value, setValue] = useState(script);

  useEffect(() => setValue(script), [script]);

  useEffect(() => {
    if (value === script) return;
    const timeout = setTimeout(() => onChangeScript(value), DebounceDelay);
    return () => clearTimeout(timeout);
  }, [onChangeScript, script, value]);

  return [value, setValue] as const;
}
