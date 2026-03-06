import 'dotenv/config';

process.on('uncaughtException', (err) => {
  console.error('[PrepOpening] Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[PrepOpening] Unhandled rejection at', promise, 'reason:', reason);
  process.exit(1);
});

function main(): void {
  const rawPort = process.env.PORT;
  const PORT = (rawPort !== undefined && rawPort !== '' && !Number.isNaN(Number(rawPort)))
    ? Number(rawPort)
    : 4000;
  console.log(`[PrepOpening] Starting server, PORT=${PORT} (env.PORT=${rawPort ?? 'not set'})`);

  const { createApp } = require('./app');
  const app = createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PrepOpening] API listening on 0.0.0.0:${PORT}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    console.error('[PrepOpening] Listen error:', err.message, err.code);
    process.exit(1);
  });
}

try {
  main();
} catch (err) {
  console.error('[PrepOpening] Startup failed:', err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
}
