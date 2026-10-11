// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { TrialStage } from '../../src/ui/TrialStage';
import { AudioEngine } from '../../src/io/audio';
import { DEFAULT_GEOMETRY } from '../../src/store/db';

describe('TrialStage', () => {
  it('zeigt bei einem Fehler im Ablauf eine deutsche Meldung statt des Kreuzes', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    await act(async () => {
      render(
      <TrialStage
        geometry={DEFAULT_GEOMETRY}
        audio={new AudioEngine()}
        run={async () => {
          throw new Error('Connection to Indexed Database server lost');
        }}
      />,
      root,
      );
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(root.textContent).toMatch(/Fehler/);
    expect(root.textContent).toMatch(/neu öffnen/);
    render(null, root);
    root.remove();
  });
});
