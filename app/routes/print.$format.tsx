/**
 * Print export — the production file for the print vendor.
 *
 * Every personalized order carries a `_Print File` link (and a `_Studio Config`
 * blob) in its cart/order attributes. Opening that link renders the customer's
 * EXACT design with 0.125" printer's bleed added on all four sides:
 *   • the paper (and any full-bleed border) extends into the bleed
 *   • decorative screen effects (shadow, stacked sheets, grain) are dropped
 *   • the page is sized in physical inches (1 SVG unit = 0.01"), so
 *     File → Print → Save as PDF at 100% scale yields a dimensionally exact,
 *     press-ready file. Zero editing after the customer designs.
 */
import {useParams, useSearchParams} from 'react-router';
import {
  STUDIO_FORMATS,
  defaultStudioConfig,
  PRINT_BLEED,
  type StudioFormatKey,
  type StudioConfig,
} from '~/lib/studio';
import {StudioCanvas} from '~/components/studio/StudioCanvas';

export default function PrintExport() {
  const {format: key} = useParams();
  const [sp] = useSearchParams();
  const format = STUDIO_FORMATS[key as StudioFormatKey];
  if (!format) {
    return <p style={{padding: 32, fontFamily: 'monospace'}}>Unknown format “{key}”.</p>;
  }

  let config: StudioConfig = defaultStudioConfig(format);
  try {
    const raw = sp.get('c');
    if (raw) config = {...config, ...(JSON.parse(raw) as Partial<StudioConfig>)};
  } catch {
    // fall through with defaults; the spec header still identifies the format
  }

  const trimW = format.width / 100;
  const trimH = format.height / 100;
  const docW = (format.width + PRINT_BLEED * 2) / 100;
  const docH = (format.height + PRINT_BLEED * 2) / 100;

  return (
    <main style={{background: '#E9E6DF', minHeight: '100vh', padding: 28}}>
      <style>{`@media print { .no-print { display: none; } main { background: #fff !important; padding: 0 !important; } }`}</style>
      <div
        className="no-print"
        style={{fontFamily: 'monospace', fontSize: 12, color: '#2D2D2D', marginBottom: 14, lineHeight: 1.7}}
      >
        <b>PRINT FILE · {format.label}</b>
        <br />
        Trim {trimW}″ × {trimH}″ · Bleed 0.125″ all sides · Document {docW}″ × {docH}″
        <br />
        File → Print → Save as PDF at 100% scale. Do not fit-to-page.
      </div>
      <div style={{width: `${docW}in`, height: `${docH}in`, background: '#fff'}}>
        <StudioCanvas
          format={format}
          config={config}
          printBleed={PRINT_BLEED}
          className="w-full h-full"
        />
      </div>
    </main>
  );
}
