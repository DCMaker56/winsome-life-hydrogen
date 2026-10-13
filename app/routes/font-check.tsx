/*
 * TEMPORARY diagnostic page (/font-check) — reports how the viewer's browser
 * loads each personalization font, so Sydney can screenshot it. Remove before
 * publishing to main.
 */
import {useEffect, useState} from 'react';
import {FONTS} from '~/lib/variants';

export const meta = () => [
  {title: 'Font check'},
  {name: 'robots', content: 'noindex'},
];

type Row = {
  label: string;
  family: string;
  faces: string;
  check: string;
  width: string;
  verdict: string;
};

function familyOf(stack: string) {
  return stack.split(',')[0].trim().replace(/^'|'$/g, '');
}

function fallbackOf(stack: string) {
  return stack.split(',').slice(1).join(',');
}

function measure(fontFamily: string) {
  const c = document.createElement('canvas').getContext('2d');
  if (!c) return 0;
  c.font = `40px ${fontFamily}`;
  return Math.round(c.measureText('Amelia Smith').width);
}

export default function FontCheck() {
  const [rows, setRows] = useState<Row[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [ua, setUa] = useState('');

  useEffect(() => {
    setUa(navigator.userAgent);
    (async () => {
      const out: Row[] = [];
      for (const f of FONTS) {
        const family = familyOf(f.fontFamily);
        let loaded = 0;
        let error = '';
        try {
          loaded = (await document.fonts.load(`40px "${family}"`, 'Amelia')).length;
        } catch (e) {
          error = String(e);
        }
        const faces = [...document.fonts]
          .filter((ff) => ff.family.replace(/"/g, '') === family)
          .map((ff) => ff.status)
          .join(', ');
        const full = measure(f.fontFamily);
        const fb = measure(fallbackOf(f.fontFamily));
        out.push({
          label: f.label,
          family,
          faces: faces || '(none — Google/system font)',
          check: `${document.fonts.check(`40px "${family}"`)} / loaded ${loaded}${error ? ' / ERROR ' + error : ''}`,
          width: `${full}px vs stand-in ${fb}px`,
          verdict: full !== fb ? 'OK — real font' : 'STAND-IN SHOWING',
        });
      }
      setRows(out);
      setResources(
        performance
          .getEntriesByType('resource')
          .filter((r) => /\.(woff2|ttf|otf)/.test(r.name))
          .map((r) => {
            const rt = r as PerformanceResourceTiming & {responseStatus?: number};
            return `${rt.name.split('/').pop()} — status ${rt.responseStatus ?? '?'}, ${rt.transferSize} bytes`;
          }),
      );
    })();
  }, []);

  return (
    <div style={{padding: 24, fontFamily: 'system-ui, sans-serif', fontSize: 13}}>
      <h1 style={{fontSize: 20, marginBottom: 8}}>Font check</h1>
      <p style={{marginBottom: 16, color: '#666'}}>{ua}</p>
      <table style={{borderCollapse: 'collapse', width: '100%'}}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} style={{borderTop: '1px solid #ddd'}}>
              <td style={{padding: 6, fontWeight: 600}}>{r.label}</td>
              <td style={{padding: 6, fontSize: 28, fontFamily: FONTS.find((f) => f.label === r.label)?.fontFamily}}>
                Amelia
              </td>
              <td style={{padding: 6}}>{r.faces}</td>
              <td style={{padding: 6}}>{r.check}</td>
              <td style={{padding: 6}}>{r.width}</td>
              <td style={{padding: 6, fontWeight: 600, color: r.verdict.startsWith('OK') ? 'green' : 'crimson'}}>
                {r.verdict}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{fontSize: 15, margin: '20px 0 6px'}}>Font files downloaded</h2>
      <ul>
        {resources.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
