import 'dotenv/config';
import { createApp } from './app';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at', promise, 'reason:', reason);
  process.exit(1);
});

const PORT: number = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PrepOpening API running on port ${PORT}`);
});
