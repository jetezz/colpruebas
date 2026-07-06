export type CoverageMethod = 'Unit' | 'PW-CLI' | 'PW-AUTO' | 'Manual';
export type AppMapCoverageState =
  | 'covered'
  | 'partial'
  | 'missing'
  | 'not-applicable';

export type DerivedVisualState =
  | 'no-test'
  | 'not-applicable'
  | 'not-run'
  | 'passed'
  | 'failed'
  | 'partial'
  | 'manual-evidence'
  | 'manual-missing';

export type VisualColor =
  | 'green'
  | 'red'
  | 'amber'
  | 'gray'
  | 'blue';

export interface CriterionInventory {
  hasUnitTest: boolean;
  hasPwautoSpec: boolean;
  hasPwcliEvidence: boolean;
  hasManualEvidence: boolean;
}

export interface LastRun {
  status: 'passed' | 'failed' | 'partial' | 'skipped';
  finishedAt?: string;
}

export interface ResolveStatusInput {
  method: CoverageMethod;
  coverage: AppMapCoverageState;
  inventory?: CriterionInventory;
  lastRun?: LastRun;
  manualMandatory?: boolean;
}

export interface ResolveStatusResult {
  state: DerivedVisualState;
  color: VisualColor;
  label: string;
  isActionable: boolean;
  isEvidence: boolean;
  isMutating: boolean;
}

export function resolveStatus(
  input: ResolveStatusInput,
): ResolveStatusResult {
  const { method, coverage, inventory, lastRun, manualMandatory } = input;

  const inv = inventory ?? {
    hasUnitTest: false,
    hasPwautoSpec: false,
    hasPwcliEvidence: false,
    hasManualEvidence: false,
  };

  if (method === 'Unit' || method === 'PW-AUTO') {
    const hasTest =
      method === 'Unit' ? inv.hasUnitTest : inv.hasPwautoSpec;
    if (!hasTest) {
      return {
        state: 'no-test',
        color: 'gray',
        label: method === 'Unit' ? 'Sin test unit' : 'Sin PW-AUTO',
        isActionable: false,
        isEvidence: false,
        isMutating: false,
      };
    }
    if (coverage === 'not-applicable') {
      return {
        state: 'not-applicable',
        color: 'gray',
        label: 'No aplica',
        isActionable: false,
        isEvidence: false,
        isMutating: false,
      };
    }
    if (coverage === 'covered' && lastRun?.status === 'passed') {
      return {
        state: 'passed',
        color: 'green',
        label: 'Cubierto',
        isActionable: false,
        isEvidence: false,
        isMutating: false,
      };
    }
    if (lastRun?.status === 'failed') {
      return {
        state: 'failed',
        color: 'red',
        label: 'Falló',
        isActionable: true,
        isEvidence: false,
        isMutating: false,
      };
    }
    if (coverage === 'partial') {
      return {
        state: 'partial',
        color: 'amber',
        label: 'Parcial',
        isActionable: true,
        isEvidence: false,
        isMutating: false,
      };
    }
    return {
      state: 'not-run',
      color: 'red',
      label: 'Pendiente',
      isActionable: true,
      isEvidence: false,
      isMutating: false,
    };
  }

  if (method === 'PW-CLI') {
    if (coverage === 'covered') {
      return {
        state: 'manual-evidence',
        color: 'blue',
        label: 'Evidencia PW-CLI',
        isActionable: false,
        isEvidence: true,
        isMutating: false,
      };
    }
    if (coverage === 'partial') {
      return {
        state: 'partial',
        color: 'amber',
        label: 'Parcial PW-CLI',
        isActionable: true,
        isEvidence: true,
        isMutating: false,
      };
    }
    if (coverage === 'not-applicable') {
      return {
        state: 'not-applicable',
        color: 'gray',
        label: 'No aplica',
        isActionable: false,
        isEvidence: false,
        isMutating: false,
      };
    }
    return {
      state: 'manual-missing',
      color: 'gray',
      label: 'Sin evidencia PW-CLI',
      isActionable: true,
      isEvidence: true,
      isMutating: false,
    };
  }

  if (method === 'Manual') {
    if (coverage === 'covered') {
      return {
        state: 'manual-evidence',
        color: 'green',
        label: 'Evidencia',
        isActionable: false,
        isEvidence: true,
        isMutating: false,
      };
    }
    if (coverage === 'not-applicable') {
      return {
        state: 'not-applicable',
        color: 'gray',
        label: 'No aplica',
        isActionable: false,
        isEvidence: false,
        isMutating: false,
      };
    }
    if (manualMandatory) {
      return {
        state: 'manual-missing',
        color: 'amber',
        label: 'Sin evidencia manual',
        isActionable: true,
        isEvidence: true,
        isMutating: false,
      };
    }
    return {
      state: 'manual-missing',
      color: 'gray',
      label: 'Sin evidencia',
      isActionable: false,
      isEvidence: true,
      isMutating: false,
    };
  }

  return {
    state: 'no-test',
    color: 'gray',
    label: 'Sin test',
    isActionable: false,
    isEvidence: false,
    isMutating: false,
  };
}

export function buildLegend(): Array<{
  state: DerivedVisualState;
  color: VisualColor;
  label: string;
  description: string;
}> {
  return [
    {
      state: 'passed',
      color: 'green',
      label: 'Cubierto',
      description: 'El test existe y pasó la última corrida.',
    },
    {
      state: 'manual-evidence',
      color: 'blue',
      label: 'Evidencia',
      description: 'Evidencia PW-CLI o Manual registrada.',
    },
    {
      state: 'partial',
      color: 'amber',
      label: 'Parcial',
      description: 'Cobertura parcial; revisar manualmente.',
    },
    {
      state: 'not-run',
      color: 'red',
      label: 'Pendiente',
      description: 'El test existe pero no se ha corrido.',
    },
    {
      state: 'failed',
      color: 'red',
      label: 'Falló',
      description: 'La última corrida del test falló.',
    },
    {
      state: 'manual-missing',
      color: 'gray',
      label: 'Sin evidencia',
      description: 'PW-CLI o Manual sin evidencia registrada.',
    },
    {
      state: 'no-test',
      color: 'gray',
      label: 'Sin test',
      description: 'No existe archivo de test o spec para el criterio.',
    },
    {
      state: 'not-applicable',
      color: 'gray',
      label: 'No aplica',
      description: 'El método no aplica para este criterio.',
    },
  ];
}