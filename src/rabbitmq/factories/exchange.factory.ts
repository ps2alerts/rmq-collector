import { Inject, Injectable } from '@nestjs/common';
import { RABBITMQ } from '../constants';
import { AmqpConnectionManager, Options } from 'amqp-connection-manager';
import { Exchange } from '../utils/exchange';

@Injectable()
export class ExchangeFactory {
  constructor(
    @Inject(RABBITMQ) private readonly rabbit: AmqpConnectionManager,
  ) {}

  create(
    exchangeName: string,
    type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match' | string,
    options?: Options.AssertExchange,
  ): Exchange {
    const channel = this.rabbit.createChannel({
      setup: async (channel) => {
        await channel.assertExchange(exchangeName, type, options);
      },
    });

    return new Exchange(channel, exchangeName);
  }
}
