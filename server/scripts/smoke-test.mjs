const port = process.env.PORT ?? '3001';
const baseUrl = (process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/+$/, '');
const healthUrl = `${baseUrl}/api/health`;

try {
  const response = await fetch(healthUrl, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Health endpoint returned HTTP ${response.status}`);
  }

  const body = await response.json();

  if (body?.status !== 'ok') {
    throw new Error(`Unexpected health response: ${JSON.stringify(body)}`);
  }

  console.log(`Smoke test passed: ${healthUrl}`);
} catch (error) {
  console.error(`Smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
