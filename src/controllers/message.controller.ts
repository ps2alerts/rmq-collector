import { Stream } from 'ps2census';
import { filter, fromEvent, map, Subscription } from 'rxjs';
import { Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EVENT_PAYLOAD_EXCHANGE } from '../rabbitmq/constants';
import { Exchange } from '../rabbitmq/utils/exchange';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

export class MessageController implements OnModuleInit, OnModuleDestroy {
  private messageSubscription?: Subscription;

  constructor(
    private readonly client: Stream.Client,
    @Inject(EVENT_PAYLOAD_EXCHANGE) private readonly exchange: Exchange,
    @InjectMetric('ess_message_count') private readonly messageCounter: Counter,
  ) {}

  onModuleInit(): void {
    this.messageSubscription = fromEvent(this.client, 'message')
      .pipe(
        filter<any>(
          (msg) => msg.service == 'event' && msg.type == 'serviceMessage',
        ),
        map((msg) => msg.payload),
      )
      .subscribe((payload) => {
        this.publishMessage(payload);
      });
  }

  onModuleDestroy(): void {
    this.messageSubscription?.unsubscribe();
  }

  publishMessage(payload: Stream.PS2Event): void {
    const { event_name, world_id } = payload;
    this.messageCounter.inc({ event_name, world_id });

    let routeKey = `${event_name}.${world_id}`;
    if ('zone_id' in payload) routeKey += `.${payload.zone_id}`;

    void this.exchange.publish(routeKey, payload);
  }
}
