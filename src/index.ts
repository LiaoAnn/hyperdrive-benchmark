import { Hono } from 'hono';
import ping from './routes/ping';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route('/ping', ping);

export default app
