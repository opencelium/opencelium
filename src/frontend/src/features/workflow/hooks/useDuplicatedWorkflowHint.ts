import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';

export type DuplicatedWorkflowLocationState = { duplicatedTitle: string };

const HINT_MESSAGE_KEY = 'workflow-duplicated-title-hint';
const HINT_DURATION_SEC = 8;

const isDuplicatedState = (state: unknown): state is DuplicatedWorkflowLocationState =>
  !!state && typeof state === 'object' && 'duplicatedTitle' in state
  && typeof state.duplicatedTitle === 'string';

export function useDuplicatedWorkflowHint() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n('workflow');
  // StrictMode (and any re-render before the replace below lands) re-runs the
  // effect while location.state still carries the flag — show once per entry.
  const shownForKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDuplicatedState(location.state)) return;
    if (shownForKeyRef.current === location.key) return;
    shownForKeyRef.current = location.key;
    message.info({
      content: t('messages.duplicatedTitleHint', { name: location.state.duplicatedTitle }),
      key: HINT_MESSAGE_KEY,
      duration: HINT_DURATION_SEC,
    });
    // Drop the flag so a reload or back/forward to this entry doesn't repeat the hint.
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.state, location.key, location.pathname, location.search, navigate, t]);
}
