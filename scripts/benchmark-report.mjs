// Release reports can land before the benchmark index is refreshed.
// Match only this release's full-run result rows, never historical comparisons.
export function releaseMetrics(markdown, version) {
  const rows = new Map();
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').slice(1, -1).map(cell => cell.replaceAll('*', '').trim());
    for (const mode of ['FTS', 'local']) {
      if (cells[0] !== `${mode} ${version}`) continue;
      const hit1 = Number(cells[1]);
      const hit5 = Number(cells[2]);
      if (cells[1] && cells[2] && Number.isFinite(hit1) && Number.isFinite(hit5)) rows.set(mode, { hit1, hit5 });
    }
  }
  return rows;
}
