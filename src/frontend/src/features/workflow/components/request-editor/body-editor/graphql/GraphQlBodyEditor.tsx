
//import './monacoWorkers';
import { useEffect } from 'react';
import { GraphiQL } from 'graphiql';
// graphiql.css only carries the container/layout rules — the design tokens (--color-base,
// --px-8, etc.) that those rules read via var(...) are declared in style.css. Without it,
// every themed element (buttons, tabs, sidebar) falls back to unstyled browser defaults.
import 'graphiql/style.css';
import 'graphiql/graphiql.css';
// Must load after the two imports above so its higher z-index wins the cascade.
import './graphiqlOverrides.css';
import { useGraphiQLActions, type TabsState } from '@graphiql/react';
import { MasterPasswordGate } from '@features/master-password';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Hint } from '@shared/ui/primitives/Hint';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useGraphQlBodyEditor } from './useGraphQlBodyEditor';

type Props = { readOnly?: boolean };

// @graphiql/react's own auto-introspect-on-mount effect races against something in its own
// internal store setup and silently fails (no request, no visible error) — confirmed
// separately that manually re-triggering it (its Ctrl+R shortcut) works fine once mounted.
// Calling the same action immediately on our own mount hits the identical race (our child
// effect fires in the same "first commit" tier as the library's own broken auto-trigger), so
// this still needs a short delay — the fix here is *what* triggers it (the real `introspect`
// action via useGraphiQLActions, not a simulated keyboard event), not just *when*.
//
// <GraphiQL> forwards its `children` prop all the way down into the same GraphiQLProvider
// context it uses internally, so rendering this here gives direct, reliable access to that
// action. Three delayed attempts hedge against slower first-time worker/editor startup (the
// third, longer delay covers cold starts where worker init itself pushes past 1500ms); all are
// safe since @graphiql/react's schema store discards all but the latest in-flight introspection.
function ForceIntrospection() {
  const { introspect } = useGraphiQLActions();
  useEffect(() => {
    const timers = [setTimeout(introspect, 400), setTimeout(introspect, 1500), setTimeout(introspect, 4000)];
    return () => timers.forEach(clearTimeout);
  }, [introspect]);
  return null;
}

function GraphQlBodyEditorContent({ readOnly }: Props) {
  const { t } = useI18n('workflow');
  const { themeMode } = useTheme();
  const { status, errorKey, fetcher, updateQuery, initialQuery, retry } = useGraphQlBodyEditor();

  if (status === 'error') {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <div
          data-testid="workflow-graphql-error"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}
        >
          <Alert type="error" showIcon message={t(`graphqlBody.${errorKey ?? 'loginFailed'}`)} />
          <Button onClick={retry} testId="workflow-graphql-retry">
            {t('graphqlBody.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <Loading />
      </div>
    );
  }

  // Fires on every tab-state change — editing the active tab, switching tabs, adding/closing
  // a tab — not just edits. That's what makes "the active tab" actually authoritative for
  // what gets saved: without this, switching to a tab you haven't typed in yet would leave
  // the previously-active tab's query as the persisted one, contradicting what's on screen.
  const handleTabChange = (tabState: TabsState) => {
    const activeQuery = tabState.tabs[tabState.activeTabIndex]?.query ?? '';
    updateQuery(activeQuery);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="workflow-graphql-editor">
      <div style={{ flex: 1, minHeight: 0 }}>
        <GraphiQL
          fetcher={fetcher}
          initialQuery={initialQuery}
          onTabChange={handleTabChange}
          forcedTheme={themeMode}
          isHeadersEditorEnabled={!readOnly}
        >
          <ForceIntrospection />
        </GraphiQL>
      </div>
      <Hint>{t('graphqlBody.editorHint')}</Hint>
    </div>
  );
}

export function GraphQlBodyEditor({ readOnly }: Props) {
  const { t } = useI18n('workflow');

  return (
    <MasterPasswordGate title={t('graphqlBody.masterPasswordTitle')}>
      <GraphQlBodyEditorContent readOnly={readOnly} />
    </MasterPasswordGate>
  );
}
