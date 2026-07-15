import { ASSISTANT_MODES, type AssistantMode } from './assistant-modes';

describe('AssistantModes', () => {
  const modes: AssistantMode[] = ['rewrite', 'expand', 'summarize', 'translate', 'tone'];

  it.each(modes)('mode "%s" has non-empty system prompt', (mode) => {
    const config = ASSISTANT_MODES[mode];
    expect(config).toBeDefined();
    expect(config.system.length).toBeGreaterThan(10);
  });

  it.each(modes)('mode "%s" has non-empty label', (mode) => {
    const config = ASSISTANT_MODES[mode];
    expect(config.label.length).toBeGreaterThan(0);
  });

  it('has exactly 5 modes', () => {
    expect(Object.keys(ASSISTANT_MODES)).toHaveLength(5);
  });
});
