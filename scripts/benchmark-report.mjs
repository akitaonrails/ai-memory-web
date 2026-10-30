// Match the requested release's full-run rows by column name. Reports may
// add metrics between hit@1 and hit@5 without changing the facts we track.
export function releaseMetrics(markdown, version) {
  const rows = new Map();
  let columns;
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').slice(1, -1).map(cell => cell.replaceAll('*', '').trim());
    if (cells[0] === 'mode') {
      columns = { hit1: cells.indexOf('hit@1'), hit5: cells.indexOf('hit@5') };
      continue;
    }
    if (!columns || columns.hit1 < 0 || columns.hit5 < 0) continue;
    for (const mode of ['FTS', 'local']) {
      if (cells[0] !== `${mode} ${version}`) continue;
      const hit1 = Number(cells[columns.hit1]);
      const hit5 = Number(cells[columns.hit5]);
      if (cells[columns.hit1] && cells[columns.hit5] && Number.isFinite(hit1) && Number.isFinite(hit5)) rows.set(mode, { hit1, hit5 });
    }
  }
  return rows;
}
