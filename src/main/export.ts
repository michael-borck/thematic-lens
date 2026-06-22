import { effectiveLabels, getThemes } from './database';

// Minimal REFI-QDA codebook (the open interchange standard QualCoder / NVivo /
// ATLAS.ti / MAXQDA all read), built from the *human-curated* result: the theme
// hierarchy if one was set, else a flat list of effective labels (the human's
// resolution where they disagreed, the engine's label otherwise).

const NS = 'urn:QDA-XML:codebook:1.0';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function refiCodebook(projectId: number): string {
  const themes = getThemes(projectId);
  let codes: string;

  if (themes.length) {
    const byParent = new Map<number | null, typeof themes>();
    for (const t of themes) {
      const arr = byParent.get(t.parent_id) ?? [];
      arr.push(t);
      byParent.set(t.parent_id, arr);
    }
    const render = (parentId: number | null, depth: number): string =>
      (byParent.get(parentId) ?? [])
        .map((t) => {
          const pad = '  '.repeat(depth);
          const desc = t.description ? `<Description>${esc(t.description)}</Description>` : '';
          const kids = render(t.id, depth + 1);
          return `${pad}<Code name="${esc(t.name)}" isCodable="true">${desc}${kids}</Code>\n`;
        })
        .join('');
    codes = render(null, 2);
  } else {
    codes = effectiveLabels(projectId)
      .map((l) => `    <Code name="${esc(l.label)}" isCodable="true"/>\n`)
      .join('');
  }

  return (
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    `<CodeBook xmlns="${NS}">\n  <Codes>\n${codes}  </Codes>\n</CodeBook>\n`
  );
}
