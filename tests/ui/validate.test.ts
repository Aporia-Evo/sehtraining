import { describe, it, expect } from 'vitest';
import { parseCm } from '../../src/ui/validate';

const MSG = 'Bitte einen Wert zwischen 10 und 200 cm eingeben.';

describe('parseCm', () => {
  it.each([
    ['24,5', 24.5],
    ['24.5', 24.5],
    [' 30 ', 30],
    ['10', 10],
    ['200', 200],
  ])('%s → %s', (input, value) => {
    expect(parseCm(input)).toEqual({ ok: true, value });
  });

  it.each(['5', '0', 'abc', '', '250', '9,99', '24,5,1', '1e2', '-30'])('%s → abgelehnt', (input) => {
    expect(parseCm(input)).toEqual({ ok: false, message: MSG });
  });
});
