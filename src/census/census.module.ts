import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Stream } from 'ps2census';
import { ConfigService } from '@nestjs/config';
import {
  defer,
  exhaustMap,
  fromEvent,
  merge,
  mergeMap,
  of,
  retry,
  Subscription,
  timer,
} from 'rxjs';
import { InjectMetric, makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@Module({
  providers: [
    makeCounterProvider({
      name: 'ess_connect_count',
      help: 'No of connects of Census ESS',
    }),

    makeCounterProvider({
      name: 'ess_disconnect_count',
      help: 'No of disconnects of Census ESS',
      labelNames: ['code'],
    }),

    {
      provide: Stream.Client,
      useFactory: (config: ConfigService) =>
        new Stream.Client(
          config.getOrThrow('census.serviceID'),
          config.getOrThrow('census.environment'),
          {
            endpoint: config.get('census.wsEndpoint'),
          },
        ),
      inject: [ConfigService],
    },
  ],
  exports: [Stream.Client],
})
export class CensusModule implements OnModuleInit, OnModuleDestroy {
  private connector?: Subscription;

  constructor(
    private readonly client: Stream.Client,
    private readonly config: ConfigService,
    @InjectMetric('ess_connect_count') connectCounter: Counter,
    @InjectMetric('ess_disconnect_count') disconnectCounter: Counter,
  ) {
    client
      .on('ready', () => connectCounter.inc())
      .on('close', (code) => disconnectCounter.inc({ code }));

    fromEvent(this.client, 'ready').subscribe(() => {
      try {
        this.client.send({
          service: 'event',
          action: 'subscribe',
          eventNames: ['all'],
          worlds: ['all'],
          characters: ['all'],
        });
      } catch {}
    });
  }

  async onModuleInit(): Promise<void> {
    const reconnectDelay = this.config.get('census.reconnectDelay');

    this.connector = merge(
      of(this.client),
      fromEvent(this.client, 'close').pipe(mergeMap(() => reconnectDelay)),
    )
      .pipe(
        exhaustMap(() =>
          defer(() => this.client.connect()).pipe(
            retry({ delay: () => timer(reconnectDelay) }),
          ),
        ),
      )
      .subscribe();
  }

  onModuleDestroy(): void {
    this.connector?.unsubscribe();
    this.client.destroy();
  }
}
