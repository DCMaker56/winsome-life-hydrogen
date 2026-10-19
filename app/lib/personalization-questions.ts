/**
 * Per-product personalization questions, managed in Shopify admin: each
 * product's "Personalization questions" metafield (winsome.personalization_questions)
 * lists "Personalization question" metaobject entries. Text, Font and Ink
 * Color are always asked; these are the product's extra questions. A product
 * whose "Personalization questions draft" switch (winsome.personalization_draft)
 * is on only shows them on links with ?drafts=1.
 */
import type {FieldGroup, PersonalizationField} from '~/lib/variants';

type MetaobjectFields = {fields: Array<{key: string; value?: string | null}>};

const SECTION_TO_GROUP: Record<string, FieldGroup> = {
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
    const get = (k: string) => entry.fields.find((f) => f.key === k)?.value ?? '';
    const label = get('label').trim();
    if (!label) return [];
    const answerType = get('answer_type');
    const options = parseList(get('choices'));
    const type: PersonalizationField['type'] =
      answerType === 'Color'
        ? 'color'
        : answerType === 'Pick one' && options.length
          ? 'choice'
          : answerType === 'Long text'
            ? 'longtext'
            : 'text';
    return [
      {
        key: label,
        label,
        type,
        options: type === 'choice' ? options : undefined,
        maxLength: type === 'longtext' ? 300 : 100,
        placeholder: '',
        helpText: get('help_text') || undefined,
        required: get('required') === 'true',
        group: SECTION_TO_GROUP[get('section')] ?? 'text',
      },
    ];
  });
}

/** Standard questions a product can skip via its "Hide standard questions" field. */
export type HiddenStandard = 'Text' | 'Font' | 'Ink Color' | 'Additional instructions';

export function parseHiddenStandard(value?: string | null): HiddenStandard[] {
  return parseList(value) as HiddenStandard[];
}
