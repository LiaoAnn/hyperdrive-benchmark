import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';

const app = new Hono().get(
  '/',
  describeRoute({
    description: 'Ping endpoint to check if the service is running',
    responses: {
      200: {
        description: 'Pong response',
        content: {
          'application/json': {
            schema: { type: 'string' },
          },
        },
      },
    },
  }),
  c => c.json('pong'),
);

export default app;
