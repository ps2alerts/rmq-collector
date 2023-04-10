import { env, envInt, envSplit } from './utils/env';

export const config = () => ({
  app: {
    port: env('APP_PORT', '3000'),
  },

  logger: {
    levels: envSplit('LOG_LEVELS', ['error', 'warn', 'log']),
  },

  census: {
    serviceID: env('CENSUS_SERVICE_ID'),
    environment: env('CENSUS_ENVIRONMENT'),
    wsEndpoint: env(
      'CENSUS_WS_ENDPOINT',
      'wss://push.nanite-systems.net/streaming',
    ),
    reconnectDelay: envInt('CENSUS_RECONNECT_DELAY', 10, 2) * 1000,
  },

  rabbitmq: {
    urls: envSplit('RABBITMQ_URLS', ['amqp://guest:guest@localhost:5672']),
    publishExchange: env('RABBITMQ_PUBLISH_EXCHANGE', 'ps2events'),
  },
});
