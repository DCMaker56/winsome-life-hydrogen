/**
 * POST /api/upload — the product page's upload button sends the customer's
 * photo or logo here (form fields "file" and "label"); it's saved to the
 * store's Shopify Files and the link comes back for the cart line.
 */
import type {Route} from './+types/api.upload';
import {
  saveUpload,
  stampUploadedFiles,
  type UploadResult,
} from '~/lib/uploads.server';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST')
    return Response.json({ok: false, error: 'Method not allowed'}, {status: 405});

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ok: false, error: 'Please choose a file to upload.'}, {status: 400});
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0)
    return Response.json({ok: false, error: 'Please choose a file to upload.'}, {status: 400});

  context.waitUntil?.(stampUploadedFiles(context.env));
  const result: UploadResult = await saveUpload(
    context.env,
    file,
    String(form.get('label') ?? 'Upload'),
  );
  if (!result.ok && result.error === 'unavailable')
    return Response.json(
      {
        ok: false,
        error:
          'Sorry, uploads aren’t working right now. Please try again, or email your file to us after ordering.',
      },
      {status: 503},
    );
  return Response.json(result, {status: result.ok ? 200 : 400});
}
