import { Inject, Logger, Module } from '@nestjs/common';
import { EVENT_PAYLOAD_EXCHANGE, RABBITMQ } from './constants';
import { ConfigService } from '@nestjs/config';
import { AmqpConnectionManager, connect } from 'amqp-connection-manager';
import { ExchangeFactory } from './factories/exchange.factory';

@Module({
  providers: [
    ExchangeFactory,

    {
      provide: Logger,
      useFactory: () => new Logger('RabbitMQ'),
    },
    {
      provide: RABBITMQ,
      useFactory: (config: ConfigService) =>
        connect(config.get('rabbitmq.urls')),
      inject: [ConfigService],
    },
    {
      provide: EVENT_PAYLOAD_EXCHANGE,
      useFactory: (config: ConfigService, factory: ExchangeFactory) =>
        factory.create(config.get('rabbitmq.publishExchange'), 'topic'),
      inject: [ConfigService],
    },
  ],
  exports: [RABBITMQ, EVENT_PAYLOAD_EXCHANGE],
})
export class RabbitmqModule {
  constructor(
    logger: Logger,
    @Inject(RABBITMQ) rabbitmq: AmqpConnectionManager,
  ) {
    rabbitmq
      .on('connectFailed', ({ err, url }) =>
        logger.warn(`Connection failed ${url}: ${err}`),
      )
      .on('blocked', ({ reason }) => logger.log(`Blocked: ${reason}`))
      .on('unblocked', () => logger.log('Unblocked'));
  }
}
