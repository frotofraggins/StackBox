const express = require('express');
const router = express.Router();
const { isEnabled } = require('../../utils/simple-tenant-flags'); // merge order tenant→global→default

router.get('/v1/sources', async (req,res)=>{
  const on = await isEnabled('CAP_DATA_INGESTION_ENABLED', { tenantId: req.headers['x-tenant-id'] });
  if (!on) return res.status(200).json({ sources: [], degraded: true });
  // mock sources
  return res.json({ sources: [
    { sourceId:'web-ga4', kind:'web', label:'Google Analytics 4', status:'configured' },
    { sourceId:'pos-square', kind:'pos', label:'Square POS', status:'connected' }
  ]});
});

router.post('/v1/datasets', async (req,res)=>{
  const on = await isEnabled('CAP_DATA_INGESTION_ENABLED', { tenantId: req.headers['x-tenant-id'] });
  if (!on) return res.status(503).json({ degraded:true, reason:'capability disabled' });
  const ds = req.body ?? {};
  ds.status = 'registered';
  return res.status(201).json(ds);
});

router.get('/v1/datasets', async (req,res)=>{
  const on = await isEnabled('CAP_DATA_INGESTION_ENABLED', { tenantId: req.headers['x-tenant-id'] });
  if (!on) return res.json({ datasets: [], degraded: true });
  return res.json({ datasets: [], degraded: false });
});

router.post('/v1/ingest/init', async (req,res)=>{
  const on = await isEnabled('CAP_DATA_INGESTION_ENABLED', { tenantId: req.headers['x-tenant-id'] });
  if (!on) return res.status(503).json({ degraded:true, reason:'capability disabled' });
  // mock signed url
  const objectKey = `raw/${Date.now()}-${Math.random().toString(36).slice(2)}.upload`;
  return res.json({
    uploadUrl: 'https://s3.mock/signed-url',
    expiresAt: new Date(Date.now()+10*60*1000).toISOString(),
    objectKey
  });
});

router.post('/v1/ingest/submit', async (req,res)=>{
  const on = await isEnabled('CAP_DATA_INGESTION_ENABLED', { tenantId: req.headers['x-tenant-id'] });
  if (!on) return res.status(503).json({ degraded:true, reason:'capability disabled' });
  const jobId = `job_${Date.now()}`;
  return res.status(202).json({ jobId, datasetId: req.body?.datasetId, status:'queued' });
});

router.get('/v1/jobs/:jobId', async (req,res)=>{
  const on = await isEnabled('CAP_DATA_INGESTION_ENABLED', { tenantId: req.headers['x-tenant-id'] });
  if (!on) return res.json({ degraded:true, reason:'capability disabled' });
  return res.json({
    jobId: req.params.jobId,
    status:'succeeded',
    metrics:{ bytes: 1024, records: 120, errors: 0 },
    startedAt: new Date(Date.now()-20000).toISOString(),
    finishedAt: new Date().toISOString()
  });
});

module.exports = router;
