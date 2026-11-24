import { describe, expect, it } from 'vitest';
import { hasLoneScriptReference } from './requestFieldRules';

const scripts = new Set(['formatDate']);
const METHOD = '#1a2b3c.(response).body.$.created';

describe('hasLoneScriptReference', () => {
  it('rejects a script variable with no method reference in the field', () => {
    expect(hasLoneScriptReference('{{global.formatDate}}', scripts)).toBe(true);
  });

  it('accepts a script variable next to a method reference, where it becomes an enhancement arg', () => {
    expect(hasLoneScriptReference(`${METHOD};{{global.formatDate}}`, scripts)).toBe(false);
  });

  it('leaves value variables and unknown kinds alone', () => {
    expect(hasLoneScriptReference('{{global.baseUrl}}', scripts)).toBe(false);
    expect(hasLoneScriptReference('{{global.formatDate}}', new Set())).toBe(false);
  });
});
