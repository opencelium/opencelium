import { useEffect } from 'react';
import { useGraphiQLActions } from '@graphiql/react';

// GraphiQL's mount introspection can run before its internal store is ready. Repeating the
// real action also covers cold worker startup; its schema store keeps only the latest request.
export function ForceGraphQlIntrospection() {
  const { introspect } = useGraphiQLActions();

  useEffect(() => {
    const timers = [400, 1500, 4000].map((delay) => setTimeout(introspect, delay));
    return () => timers.forEach(clearTimeout);
  }, [introspect]);

  return null;
}
