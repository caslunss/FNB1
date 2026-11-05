import type { WorkspaceRuntime } from './contracts';

type ExportsContext = Pick<
  WorkspaceRuntime,
  'scope' | 'S' | 'showError' | 'spreadsheetCSV' | 'todayISO'
>;

export function createExports(workspace: ExportsContext) {
  function spreadsheetCSV() {
    const cell = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const rows = [
      ['Data', 'Tipo', 'Descrição', 'Categoria', 'Pagamento', 'Valor (R$)'],
      ...[
        ...workspace.S.items.map((x) => ({ ...x, type: 'Gasto' })),
        ...workspace.S.receipts.map((x) => ({ ...x, type: 'Entrada' })),
      ]
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .map((x) => [
          x.date || '',
          x.type,
          x.d,
          x.c || '',
          x.p || '',
          Number(x.v).toFixed(2).replace('.', ','),
        ]),
    ];
    return (
      '\uFEFF' +
      rows.map((row) => row.map(cell).join(';')).join('\r\n') +
      '\r\n'
    );
  }
  return { spreadsheetCSV } satisfies Pick<WorkspaceRuntime, 'spreadsheetCSV'>;
}

export function initializeExports(workspace: ExportsContext) {
  // @workspace-step 282 ExpressionStatement
  workspace.scope.listen(document, 'click', (e) => {
    if (!(e.target as HTMLElement).closest<HTMLElement>('#exportSpreadsheet'))
      return;
    try {
      const url = workspace.scope.objectURL(
          new Blob([workspace.spreadsheetCSV()], {
            type: 'text/csv;charset=utf-8',
          }),
        ),
        a = document.createElement('a');
      a.href = url;
      a.download = 'TEFinance-lancamentos-' + workspace.todayISO() + '.csv';
      document.body.append(a);
      a.click();
      a.remove();
      workspace.scope.timeout(() => workspace.scope.revokeURL(url), 1000);
    } catch (error) {
      workspace.showError(error);
    }
  });
  // @workspace-end 282
}
