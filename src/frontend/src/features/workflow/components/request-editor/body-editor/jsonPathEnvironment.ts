import { useEffect, useState } from 'react';
import type { JSONPathEnvironment } from 'json-p3';

let loaded: JSONPathEnvironment | null = null;
let pending: Promise<JSONPathEnvironment | null> | null = null;

// json-p3 is only needed inside the workflow editor, so it is split into its
// own chunk. A failed chunk load resolves to null (validation is skipped) and
// clears `pending` so the next caller retries.
export const loadJsonPathEnvironment = (): Promise<JSONPathEnvironment | null> => {
  if (loaded) return Promise.resolve(loaded);
  pending ??= import('json-p3')
    .then(({ JSONPathEnvironment: Environment }) => {
      loaded = new Environment();
      return loaded;
    })
    .catch(() => {
      pending = null;
      return null;
    });
  return pending;
};

export function useJsonPathEnvironment(): JSONPathEnvironment | null {
  const [environment, setEnvironment] = useState(loaded);
  useEffect(() => {
    if (environment) return;
    let isActive = true;
    void loadJsonPathEnvironment().then((next) => {
      if (isActive && next) setEnvironment(next);
    });
    return () => {
      isActive = false;
    };
  }, [environment]);
  return environment;
}
