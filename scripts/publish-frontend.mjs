import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
const aws = (...args) => execFileSync('aws', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const bucket = 's3://' + process.env.S3_FRONTEND_BUCKET;
const expected = JSON.parse(readFileSync('dist/release.json', 'utf8'));
if (expected.commit !== process.env.GITHUB_SHA) throw new Error('Artifact does not match the release commit');
aws('s3', 'sync', 'dist/assets/', bucket + '/assets/', '--cache-control', 'public,max-age=31536000,immutable');
// Keep old content-hashed assets while browsers still use an older entry point.
aws('s3', 'sync', 'dist/', bucket + '/', '--exclude', 'index.html', '--exclude', 'assets/*', '--cache-control', 'no-cache,max-age=0,must-revalidate');
aws('s3', 'cp', 'dist/index.html', bucket + '/index.html', '--cache-control', 'no-cache,max-age=0,must-revalidate');
const invalidation = aws('cloudfront', 'create-invalidation', '--distribution-id', process.env.CLOUDFRONT_DIST_ID,
  '--paths', '/index.html', '/', '/release.json', '--query', 'Invalidation.Id', '--output', 'text').trim();
aws('cloudfront', 'wait', 'invalidation-completed', '--distribution-id', process.env.CLOUDFRONT_DIST_ID, '--id', invalidation);
const origin = process.env.APP_URL;
const options = { signal: AbortSignal.timeout(20000), cache: 'no-store' };
const response = await fetch(origin, options);
if (!response.ok) throw new Error('Frontend HTTP ' + response.status);
const html = await response.text();
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
if (!scripts.length) throw new Error('Frontend HTML has no application script');
for (const path of scripts) {
  const asset = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20000) });
  if (!asset.ok || !asset.headers.get('content-type')?.includes('javascript')) throw new Error('Frontend script unavailable');
}
const release = await fetch(origin + '/release.json', { signal: AbortSignal.timeout(20000), cache: 'no-store' });
if (!release.ok || (await release.json()).commit !== expected.commit) throw new Error('CloudFront is not serving the expected release');
appendFileSync(process.env.GITHUB_STEP_SUMMARY, 'Published **' + process.env.TARGET_ENV + '**: `' + expected.commit + '`\n\n' + origin + '\n');
console.log('CloudFront serves the checked release and its JavaScript assets.');
