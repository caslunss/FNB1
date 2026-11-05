import { prepareCsv as importedCsvPreview } from '../controllers/csv';
import { viewList } from '../../services/presentation.ts';
import type { Expense } from '../../types/workspace';
import type { WorkspaceRuntime } from './contracts';

type CsvPreviewContext = Pick<
  WorkspaceRuntime,
  | 'MAX_RECORDS'
  | 'S'
  | 'brl'
  | 'csvContext'
  | 'csvConvention'
  | 'csvGeneration'
  | 'csvPreview'
  | 'dateLabel'
  | 'draw'
  | 'ensureDate'
  | 'esc'
  | 'newId'
  | 'parseMoney'
  | 'requireOpenDate'
  | 'saveWorkspace'
  | 'supportedDate'
  | 'toCents'
>;

export function createCsvPreview(workspace: CsvPreviewContext) {
  function prepareCsv(text: string, convention: string) {
    return importedCsvPreview(workspace.csvContext, text, convention);
  }

  function csvPreviewView() {
    if (!workspace.csvPreview) return '';
    const p = workspace.csvPreview;
    return (
      <div className="csv-preview" role="status">
        <h3>{'Confira antes de importar'}</h3>
        <p className="foot">
          {p.records.length}
          {' lançamento(s) válido(s) · '}
          {p.errors.length}
          {' linha(s) inválida(s), que não serão importadas.'}
        </p>
        <p className="foot">
          {'Entradas: '}
          {workspace.brl(p.incomeCents / 100)}
          {' · Gastos: '}
          {workspace.brl(p.expenseCents / 100)}
        </p>
        {p.matches ? (
          <p className="bad foot">
            {p.matches}
            {
              ' lançamento(s) coincidem com registros já salvos. Confira para evitar duplicação.'
            }
          </p>
        ) : (
          ''
        )}
        {viewList(
          p.records
            .slice(0, 8)
            .map(
              (r: { d: unknown; date: string; type: string; v: unknown }) => (
                <div className="report-line">
                  <span>
                    {workspace.esc(r.d)}
                    <small>
                      {workspace.dateLabel(r.date)}
                      {' · '}
                      {r.type === 'i' ? 'Entrada' : 'Gasto'}
                    </small>
                  </span>
                  <b>{workspace.brl(r.v)}</b>
                </div>
              ),
            ),
        )}
        {viewList(
          p.errors.slice(0, 10).map((r) => (
            <p className="foot bad">
              {'Linha '}
              {r.line}
              {': '}
              {workspace.esc(r.message)}
            </p>
          )),
        )}
        <div className="row">
          <button
            className="btn"
            data-a="csvapply"
            disabled={!p.records.length}
          >
            {'Importar '}
            {p.records.length}
            {' lançamento(s)'}
          </button>
          <button className="btn g" data-a="csvcancel">
            {'Cancelar'}
          </button>
        </div>
      </div>
    );
  }

  function applyCsv() {
    if (!workspace.csvPreview?.records.length) return;
    const preview = workspace.csvPreview,
      addedItems = preview.records.filter(
        (x: { type: string }) => x.type === 'g',
      ),
      addedReceipts = preview.records.filter(
        (x: { type: string }) => x.type === 'i',
      );
    if (
      workspace.S.items.length + addedItems.length > workspace.MAX_RECORDS ||
      workspace.S.receipts.length + addedReceipts.length > workspace.MAX_RECORDS
    )
      throw Error(
        'Limite de ' +
          workspace.MAX_RECORDS +
          ' lançamentos por lista atingido.',
      );
    preview.records.forEach(({ type, ...r }) => {
      workspace.requireOpenDate(r.date);
      workspace.ensureDate(r.date);
      (type === 'i' ? workspace.S.receipts : workspace.S.items).push({
        id: workspace.newId(),
        ...r,
        ...(type === 'g' ? { c: 'Gastos Variáveis', p: 'Pix' } : {}),
      } as Expense);
    });
    workspace.saveWorkspace();
    workspace.draw();
    return preview.records.length;
  }
  return { prepareCsv, csvPreviewView, applyCsv } satisfies Pick<
    WorkspaceRuntime,
    'prepareCsv' | 'csvPreviewView' | 'applyCsv'
  >;
}

export function initializeCsvPreview(workspace: CsvPreviewContext) {
  // @workspace-step 248 FirstStatement
  workspace.csvContext = {
    get MAX_RECORDS() {
      return workspace.MAX_RECORDS;
    },
    get S() {
      return workspace.S;
    },
    supportedDate: workspace.supportedDate,
    requireOpenDate: workspace.requireOpenDate,
    parseMoney: workspace.parseMoney,
    toCents: workspace.toCents,
  };
  // @workspace-end 248
  // @workspace-step 249 FirstStatement
  workspace.csvPreview = null;
  workspace.csvGeneration = 0;
  workspace.csvConvention = '';
  // @workspace-end 249
}
