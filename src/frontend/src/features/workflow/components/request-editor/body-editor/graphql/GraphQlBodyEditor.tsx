import { GraphiQL } from 'graphiql';
// graphiql.css only carries the container/layout rules — the design tokens (--color-base,
// --px-8, etc.) that those rules read via var(...) are declared in style.css. Without it,
// every themed element (buttons, tabs, sidebar) falls back to unstyled browser defaults.
import 'graphiql/style.css';
import 'graphiql/graphiql.css';
// Must load after the two imports above so its higher z-index wins the cascade.
import './graphiqlOverrides.css';
import type { TabsState } from '@graphiql/react';
import { MasterPasswordGate } from '@features/master-password';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { Hint } from '@shared/ui/primitives/Hint';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { useGraphQlBodyEditor } from './useGraphQlBodyEditor';
import { ForceGraphQlIntrospection } from './ForceGraphQlIntrospection';
import { GraphQlBodyEditorError } from './GraphQlBodyEditorError';

type Props = { readOnly?: boolean };

function GraphQlBodyEditorContent({ readOnly }: Props) {
  const { t } = useI18n('workflow');
  const { themeMode } = useTheme();
  const { status, errorKey, fetcher, updateQuery, initialQuery, retry } = useGraphQlBodyEditor();

  if (status === 'error') {
    return <GraphQlBodyEditorError errorKey={errorKey} onRetry={retry} />;
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
          <ForceGraphQlIntrospection />
        </GraphiQL>
      </div>
      <Hint type="warning">{t('graphqlBody.editorHint')}</Hint>
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
