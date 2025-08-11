export type SourceKind = 'iot'|'pos'|'crm'|'web'|'erp'|'logs'|'sftp'|'api'|'batch';
export type FileFormat = 'jsonl'|'csv'|'parquet'|'json';
export interface ClientOpts {
  baseUrl: string;
  timeoutMs?: number;
  getAuthToken?: () => Promise<string>|string;
  tenantId: string;
}
async function req<T>(opts: ClientOpts, path: string, init?: RequestInit): Promise<T & { degraded?: boolean }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 8000);
  const headers: Record<string,string> = {
    'content-type':'application/json',
    'x-tenant-id': opts.tenantId
  };
  const tok = opts.getAuthToken ? await opts.getAuthToken() : undefined;
  if (tok) headers['authorization'] = `Bearer ${tok}`;
  try {
    const res = await fetch(`${opts.baseUrl}${path}`, { ...init, headers, signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e:any) {
    return { degraded: true, reason: e?.message } as any;
  } finally { clearTimeout(timer); }
}
export function createDataIngestionClient(opts: ClientOpts) {
  return {
    listSources: () => req<{sources:any[]}>(opts, '/v1/sources'),
    registerDataset: (dataset:any) => req<any>(opts, '/v1/datasets', { method:'POST', body: JSON.stringify(dataset)}),
    listDatasets: () => req<{datasets:any[]}>(opts, '/v1/datasets'),
    initUpload: (body:{datasetId:string,format:FileFormat,compression?:string}) =>
      req<{uploadUrl:string,expiresAt:string,objectKey:string}>(opts, '/v1/ingest/init', { method:'POST', body: JSON.stringify(body)}),
    submitUpload: (body:{datasetId:string,objectKey:string}) =>
      req<{jobId:string,status:string}>(opts, '/v1/ingest/submit', { method:'POST', body: JSON.stringify(body)}),
    jobStatus: (jobId:string) => req<any>(opts, `/v1/jobs/${encodeURIComponent(jobId)}`)
  };
}
