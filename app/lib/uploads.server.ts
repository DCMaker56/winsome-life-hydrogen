/*
 * Customer uploads (pet photos, business logos) for personalization.
 *
 * Saves the file into the store's Shopify Files (Content → Files) and returns
 * a link to it in Shopify admin, which goes on the order as a line item
 * property so production can open it straight from the order. After
 * checkout, stampUploadedFiles() renames each file to start with its order
 * number ("Order-1001-…") so Content → Files can be searched by order. (The
 * admin link survives the rename; the file's CDN address doesn't.)
 *
 * Authenticates as the "Website Uploads" Dev Dashboard app (scopes
 * `write_files`, `read_files`, `read_orders`) with the client credentials
 * grant: the
 * storefront's environment variables hold UPLOADS_CLIENT_ID and
 * UPLOADS_CLIENT_SECRET, exchanged for a 24-hour Admin API token as needed.
 */

const ADMIN_API_VERSION = '2025-10';
// The Admin API must be called on the store's myshopify.com domain.
const ADMIN_SHOP_DOMAIN = 'caatee-kr.myshopify.com';
const ADMIN_FILES_URL = 'https://admin.shopify.com/store/caatee-kr/content/files';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = /^(image\/(jpeg|png|gif|webp|heic|heif)|application\/pdf)$/;

export type UploadResult =
  | {ok: true; url: string; name: string}
  | {ok: false; error: string};

// Reused across requests within a worker until shortly before it expires.
let cachedToken: {value: string; expiresAt: number} | null = null;

async function getAdminToken(env: Env): Promise<string | null> {
  const clientId = env.UPLOADS_CLIENT_ID;
  const clientSecret = env.UPLOADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Upload failed: UPLOADS_CLIENT_ID / UPLOADS_CLIENT_SECRET are not configured.');
    return null;
  }
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const res = await fetch(`https://${ADMIN_SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    console.error('Upload failed: token request failed, HTTP', res.status);
    return null;
  }
  const json = (await res.json()) as {access_token?: string; expires_in?: number};
  if (!json.access_token) return null;
  // Refresh five minutes early; fall back to one hour if no expiry is given.
  const ttlMs = ((json.expires_in ?? 3600) - 300) * 1000;
  cachedToken = {value: json.access_token, expiresAt: Date.now() + ttlMs};
  return json.access_token;
}

async function admin<T>(token: string, query: string, variables: object): Promise<T> {
  const res = await fetch(
    `https://${ADMIN_SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
      body: JSON.stringify({query, variables}),
    },
  );
  if (!res.ok) throw new Error(`Admin API HTTP ${res.status}`);
  const json = (await res.json()) as {data?: T; errors?: unknown};
  if (!json.data) throw new Error(`Admin API error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

const STAGED_UPLOAD = `
  mutation StageUpload($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl }
      userErrors { message }
    }
  }
`;
const FILE_CREATE = `
  mutation SaveUpload($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files { id }
      userErrors { message }
    }
  }
`;
const RECENT_ORDERS = `
  query RecentOrdersWithUploads {
    orders(first: 25, sortKey: CREATED_AT, reverse: true) {
      nodes {
        name
        lineItems(first: 50) {
          nodes { customAttributes { key value } }
        }
      }
    }
  }
`;
const FILES = `
  query UploadedFiles($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on MediaImage { id alt image { url } }
      ... on GenericFile { id alt url }
    }
  }
`;
const FILE_RENAME = `
  mutation StampUpload($files: [FileUpdateInput!]!) {
    fileUpdate(files: $files) {
      userErrors { message }
    }
  }
`;

export async function saveUpload(env: Env, file: File, label: string): Promise<UploadResult> {
  if (!ALLOWED_TYPES.test(file.type))
    return {ok: false, error: 'Please upload a photo (JPG, PNG, HEIC) or a PDF.'};
  if (file.size > MAX_UPLOAD_BYTES)
    return {ok: false, error: 'That file is over 15 MB. Please choose a smaller one.'};

  try {
    const token = await getAdminToken(env);
    if (!token) return {ok: false, error: 'unavailable'};

    const isImage = file.type.startsWith('image/');
    const name = file.name.replace(/[^\w.\- ]+/g, '').slice(-80) || 'upload';
    const staged = await admin<{
      stagedUploadsCreate: {stagedTargets: {url: string; resourceUrl: string}[]};
    }>(token, STAGED_UPLOAD, {
      input: [{filename: name, mimeType: file.type, resource: isImage ? 'IMAGE' : 'FILE', httpMethod: 'PUT'}],
    });
    const target = staged.stagedUploadsCreate.stagedTargets[0];
    if (!target) throw new Error('No staged upload target');

    const put = await fetch(target.url, {
      method: 'PUT',
      headers: {'Content-Type': file.type},
      body: await file.arrayBuffer(),
    });
    if (!put.ok) throw new Error(`Staged upload HTTP ${put.status}`);

    const created = await admin<{fileCreate: {files: {id: string}[]}}>(token, FILE_CREATE, {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: isImage ? 'IMAGE' : 'FILE',
          alt: `Customer upload: ${label}`.slice(0, 500),
        },
      ],
    });
    const id = created.fileCreate.files[0]?.id;
    if (!id) throw new Error('File not created');
    return {ok: true, url: `${ADMIN_FILES_URL}/${id.split('/').pop()}`, name: file.name};
  } catch (err) {
    console.error('Upload failed:', err);
    return {ok: false, error: 'unavailable'};
  }
}

// Stamping runs in the background after page loads; once every few minutes
// per worker is plenty.
const STAMP_INTERVAL_MS = 5 * 60 * 1000;
let lastStamp = 0;

/**
 * Rename recently ordered uploads to start with their order number and note
 * the order and question in the file's alt text. Files already stamped are
 * skipped, so it's safe to run repeatedly.
 */
export async function stampUploadedFiles(env: Env): Promise<void> {
  if (Date.now() - lastStamp < STAMP_INTERVAL_MS) return;
  lastStamp = Date.now();
  try {
    const token = await getAdminToken(env);
    if (!token) return;
    const {orders} = await admin<{
      orders: {
        nodes: Array<{
          name: string;
          lineItems: {nodes: Array<{customAttributes: Array<{key: string; value?: string | null}>}>};
        }>;
      };
    }>(token, RECENT_ORDERS, {});

    // File id → the order (and question) it belongs to.
    const owners = new Map<string, {order: string; label: string}>();
    for (const order of orders.nodes) {
      for (const line of order.lineItems.nodes) {
        for (const {key, value} of line.customAttributes) {
          const m = value?.match(/\/content\/files\/(\d+)/);
          if (!m || !value?.startsWith(ADMIN_FILES_URL)) continue;
          owners.set(m[1], {order: order.name, label: key});
        }
      }
    }
    if (!owners.size) return;

    // Shopify resolves a file id whatever its type (image or PDF).
    const ids = [...owners.keys()].map((n) => `gid://shopify/MediaImage/${n}`);
    const {nodes} = await admin<{
      nodes: Array<{id?: string; alt?: string | null; image?: {url: string} | null; url?: string | null} | null>;
    }>(token, FILES, {ids});

    const updates = nodes.flatMap((file) => {
      if (!file?.id || file.alt?.startsWith('Order ')) return [];
      const owner = owners.get(file.id.split('/').pop()!);
      const url = file.image?.url ?? file.url;
      if (!owner || !url) return [];
      const current = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
      const orderNo = owner.order.replace(/^#/, '');
      return [
        {
          id: file.id,
          filename: `Order-${orderNo}-${current}`,
          alt: `Order ${owner.order} · ${owner.label}`.slice(0, 500),
        },
      ];
    });
    if (updates.length) await admin(token, FILE_RENAME, {files: updates});
  } catch (err) {
    console.error('Stamping uploads with order numbers failed:', err);
  }
}
