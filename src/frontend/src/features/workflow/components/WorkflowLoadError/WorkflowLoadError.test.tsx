import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ConfigProvider, theme } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@shared/i18n/locales/en/workflow.json';
import de from '@shared/i18n/locales/de/workflow.json';
import { WorkflowLoadError } from './WorkflowLoadError';

const locale = vi.hoisted(() => ({ value: 'en' }));
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => {
 const text = locale.value === 'de' ? de : en;
 const translations: Record<string, string> = {
  'loadError.title': text.loadError.title,
  'loadError.description': text.loadError.description,
  'loadError.retry': text.loadError.retry,
  'actions.cancel': text.actions.cancel,
 };
 return translations[key] ?? key;
} }) }));

afterEach(cleanup);
describe.each([['en', 'light'], ['en', 'dark'], ['de', 'light'], ['de', 'dark']] as const)(
 'workflow load error in %s and %s theme', (language, mode) => {
  it('shows a translated error with working Retry and Cancel controls', () => {
   locale.value = language;
   const onRetry = vi.fn();
   const onCancel = vi.fn();
   const text = language === 'de' ? de : en;
   render(<ConfigProvider theme={{ algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
    <WorkflowLoadError onRetry={onRetry} onCancel={onCancel} />
   </ConfigProvider>);
   expect(screen.getByText(text.loadError.title)).toBeInTheDocument();
   expect(screen.getByText(text.loadError.description)).toBeInTheDocument();
   fireEvent.click(screen.getByTestId('workflow-load-retry'));
   expect(onRetry).toHaveBeenCalledOnce();
   fireEvent.click(screen.getByTestId('workflow-load-cancel'));
   expect(onCancel).toHaveBeenCalledOnce();
  });
 });
