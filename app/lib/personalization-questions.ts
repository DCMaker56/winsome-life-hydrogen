/**
 * Per-product personalization questions, managed in Shopify admin: each
 * product's "Personalization questions" metafield (winsome.personalization_questions)
 * lists "Personalization question" metaobject entries. Text, Font and Ink
 * Color are always asked; these are the product's extra questions. A product
 * whose "Personalization questions draft" switch (winsome.personalization_draft)
 * is on only shows them on links with ?drafts=1.
 */
import type {FieldGroup, PersonalizationField} from '~/lib/variants';

type MetaobjectFields = {
  fields: Array<{
    key: string;
    value?: string | null;
    references?: {nodes: Array<{image?: {url: string} | null}>} | null;
  }>;
};

const SECTION_TO_GROUP: Record<string, FieldGroup> = {
  Monogram: 'monogram',
  // Shown above the main text box too, e.g. "Text for Top of Card".
  'Before text': 'monogram',
  Text: 'text',
  Border: 'border',
  Icon: 'icon',
  'Icon placement': 'placement',
  'Return address': 'return-address',
};

function parseList(value?: string | null): string[] {
  if (!value) return [];
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) ? list.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Map metaobject entries to panel fields; malformed entries are skipped. */
export function questionsToFields(
  entries: MetaobjectFields[] | null | undefined,
): PersonalizationField[] {
  return (entries ?? []).flatMap((entry) => {
    const get = (k: string) =>
      entry.fields.find((f) => f.key === k)?.value ?? '';
    const label = get('label').trim();
    if (!label) return [];
    const answerType = get('answer_type');
    const images = (
      entry.fields.find((f) => f.key === 'choice_images')?.references?.nodes ??
      []
    ).map((n) => n.image?.url ?? null);
    // Pictures without names yet: number them ("Flower 1", "Flower 2", ...).
    const named = parseList(get('choices'));
    const stem = label.replace(/\s*(choices?|options?)$/i, '') || 'Option';
    const options = named.length
      ? named
      : answerType === 'Pick one'
        ? images.filter(Boolean).map((_, i) => `${stem} ${i + 1}`)
        : [];
    const type: PersonalizationField['type'] =
      answerType === 'Color'
        ? 'color'
        : answerType === 'Pick one' && options.length
          ? 'choice'
          : answerType === 'Long text'
            ? 'longtext'
            : answerType === 'File upload'
              ? 'upload'
              : 'text';
    return [
      {
        key: label,
        label,
        type,
        options: type === 'choice' ? options : undefined,
        optionImages:
          type === 'choice' && images.some(Boolean)
            ? options.map(
                (_, i) =>
                  (named.length ? images[i] : images.filter(Boolean)[i]) ??
                  null,
              )
            : undefined,
        maxLength: type === 'longtext' ? 300 : 100,
        placeholder: '',
        helpText: get('help_text') || undefined,
        required: get('required') === 'true',
        group: SECTION_TO_GROUP[get('section')] ?? 'text',
        alternativeTo: get('alternative_to').trim() || undefined,
        photoFee: type === 'upload' && get('photo_fee') === 'true',
      },
    ];
  });
}

/** Standard questions a product can skip via its "Hide standard questions" field. */
export type HiddenStandard =
  | 'Text'
  | 'Font'
  | 'Text Color'
  | 'Ink Color' // older name for Text Color
  | 'Additional instructions';

export function parseHiddenStandard(value?: string | null): HiddenStandard[] {
  return parseList(value) as HiddenStandard[];
}
