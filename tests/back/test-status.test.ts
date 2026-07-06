// @ac PWT-11
import { describe, it, expect } from 'bun:test';
import {
  buildLegend,
  resolveStatus,
  type CriterionInventory,
} from '../../frontend/src/lib/test-status.ts';

const invUnitUnit: CriterionInventory = {
  hasUnitTest: true,
  hasPwautoSpec: false,
  hasPwcliEvidence: false,
  hasManualEvidence: false,
};

const invUnitPwauto: CriterionInventory = {
  hasUnitTest: false,
  hasPwautoSpec: true,
  hasPwcliEvidence: false,
  hasManualEvidence: false,
};

const invNone: CriterionInventory = {
  hasUnitTest: false,
  hasPwautoSpec: false,
  hasPwcliEvidence: false,
  hasManualEvidence: false,
};

describe('resolveStatus — Unit/PW-AUTO (PWT-11)', () => {
  it('Unit sin test → no-test gris', () => {
    const r = resolveStatus({
      method: 'Unit',
      coverage: 'missing',
      inventory: invNone,
    });
    expect(r.state).toBe('no-test');
    expect(r.color).toBe('gray');
    expect(r.label).toBe('Sin test unit');
    expect(r.isActionable).toBe(false);
  });

  it('PW-AUTO sin spec → no-test gris', () => {
    const r = resolveStatus({
      method: 'PW-AUTO',
      coverage: 'missing',
      inventory: invNone,
    });
    expect(r.state).toBe('no-test');
    expect(r.color).toBe('gray');
    expect(r.label).toBe('Sin PW-AUTO');
  });

  it('Unit con test + cubierto → passed verde', () => {
    const r = resolveStatus({
      method: 'Unit',
      coverage: 'covered',
      inventory: invUnitUnit,
      lastRun: { status: 'passed' },
    });
    expect(r.state).toBe('passed');
    expect(r.color).toBe('green');
    expect(r.label).toBe('Cubierto');
  });

  it('Unit con test + última corrida falló → failed rojo', () => {
    const r = resolveStatus({
      method: 'Unit',
      coverage: 'missing',
      inventory: invUnitUnit,
      lastRun: { status: 'failed' },
    });
    expect(r.state).toBe('failed');
    expect(r.color).toBe('red');
    expect(r.label).toBe('Falló');
    expect(r.isActionable).toBe(true);
  });

  it('Unit con test + sin corrida → not-run rojo Pendiente', () => {
    const r = resolveStatus({
      method: 'Unit',
      coverage: 'missing',
      inventory: invUnitUnit,
    });
    expect(r.state).toBe('not-run');
    expect(r.color).toBe('red');
    expect(r.label).toBe('Pendiente');
    expect(r.isActionable).toBe(true);
  });

  it('Unit con test + partial → partial ámbar', () => {
    const r = resolveStatus({
      method: 'Unit',
      coverage: 'partial',
      inventory: invUnitUnit,
    });
    expect(r.state).toBe('partial');
    expect(r.color).toBe('amber');
    expect(r.label).toBe('Parcial');
  });

  it('PW-AUTO con spec + not-applicable → gris No aplica', () => {
    const r = resolveStatus({
      method: 'PW-AUTO',
      coverage: 'not-applicable',
      inventory: invUnitPwauto,
    });
    expect(r.state).toBe('not-applicable');
    expect(r.color).toBe('gray');
    expect(r.label).toBe('No aplica');
  });
});

describe('resolveStatus — PW-CLI (PWT-11)', () => {
  it('PW-CLI cubierto → manual-evidence azul', () => {
    const r = resolveStatus({
      method: 'PW-CLI',
      coverage: 'covered',
    });
    expect(r.state).toBe('manual-evidence');
    expect(r.color).toBe('blue');
    expect(r.label).toContain('Evidencia');
    expect(r.isEvidence).toBe(true);
  });

  it('PW-CLI sin evidencia → manual-missing gris', () => {
    const r = resolveStatus({
      method: 'PW-CLI',
      coverage: 'missing',
    });
    expect(r.state).toBe('manual-missing');
    expect(r.color).toBe('gray');
    expect(r.label).toContain('Sin evidencia PW-CLI');
  });

  it('PW-CLI not-applicable → gris No aplica', () => {
    const r = resolveStatus({
      method: 'PW-CLI',
      coverage: 'not-applicable',
    });
    expect(r.state).toBe('not-applicable');
    expect(r.color).toBe('gray');
  });

  it('PW-CLI partial → partial ámbar Parcial PW-CLI', () => {
    const r = resolveStatus({
      method: 'PW-CLI',
      coverage: 'partial',
    });
    expect(r.state).toBe('partial');
    expect(r.color).toBe('amber');
    expect(r.label).toContain('PW-CLI');
  });
});

describe('resolveStatus — Manual (PWT-11)', () => {
  it('Manual cubierto → manual-evidence verde', () => {
    const r = resolveStatus({
      method: 'Manual',
      coverage: 'covered',
    });
    expect(r.state).toBe('manual-evidence');
    expect(r.color).toBe('green');
    expect(r.label).toBe('Evidencia');
  });

  it('Manual sin evidencia con manualMandatory=false → gris Sin evidencia', () => {
    const r = resolveStatus({
      method: 'Manual',
      coverage: 'missing',
      manualMandatory: false,
    });
    expect(r.state).toBe('manual-missing');
    expect(r.color).toBe('gray');
  });

  it('Manual sin evidencia con manualMandatory=true → ámbar Sin evidencia manual', () => {
    const r = resolveStatus({
      method: 'Manual',
      coverage: 'missing',
      manualMandatory: true,
    });
    expect(r.state).toBe('manual-missing');
    expect(r.color).toBe('amber');
    expect(r.label).toBe('Sin evidencia manual');
    expect(r.isActionable).toBe(true);
  });

  it('Manual not-applicable → gris No aplica', () => {
    const r = resolveStatus({
      method: 'Manual',
      coverage: 'not-applicable',
    });
    expect(r.state).toBe('not-applicable');
    expect(r.color).toBe('gray');
  });
});

describe('buildLegend — visibilidad (PWT-08)', () => {
  it('documenta los 8 estados derivados', () => {
    const legend = buildLegend();
    const states = legend.map((l) => l.state).sort();
    expect(states).toEqual([
      'failed',
      'manual-evidence',
      'manual-missing',
      'no-test',
      'not-applicable',
      'not-run',
      'partial',
      'passed',
    ]);
  });

  it('cada item expone label legible y color estable', () => {
    const legend = buildLegend();
    for (const item of legend) {
      expect(['green', 'red', 'amber', 'gray', 'blue']).toContain(item.color);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });
});

describe('Idempotencia (AC-019)', () => {
  it('mismo input → mismo output', () => {
    const a = resolveStatus({
      method: 'Unit',
      coverage: 'partial',
      inventory: invUnitUnit,
    });
    const b = resolveStatus({
      method: 'Unit',
      coverage: 'partial',
      inventory: invUnitUnit,
    });
    expect(a).toEqual(b);
  });
});
