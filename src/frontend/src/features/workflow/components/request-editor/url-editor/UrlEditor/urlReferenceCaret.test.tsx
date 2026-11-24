import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useUrlInlineValueEditor } from '../UrlInlineValueEditor/useUrlInlineValueEditor';

it('reports the raw start and end edges of a query token without inserting inside it', () => {
 const onCaretChange = vi.fn();
 function Field() {
  const editor = useUrlInlineValueEditor({ value: '#{%a%}/tail', endpointArgs: {}, onChange: vi.fn(), onCaretChange });
  return <div data-testid="query" contentEditable ref={editor.rootRef} onKeyUp={editor.updateCaret} />;
 }
 render(<Field />);
 const root = screen.getByTestId('query');
 root.focus();
 const token = root.querySelector('.oc-endpoint-ref')!;
 for (const [after, expected] of [[false, 0], [true, 6]] as const) {
  act(() => {
   const range = document.createRange();
   if (after) range.setStartAfter(token); else range.setStartBefore(token);
   range.collapse(true); window.getSelection()!.removeAllRanges(); window.getSelection()!.addRange(range);
  });
  fireEvent.keyUp(root, { key: after ? 'End' : 'Home' });
  expect(onCaretChange).toHaveBeenLastCalledWith(expected);
 }
});
