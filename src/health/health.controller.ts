import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorResult,
  MicroserviceHealthIndicator,
  MicroserviceHealthIndicatorOptions,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Stream } from 'ps2census';

@Controller()
export class HealthController {
  private readonly rabbitmqConfig: MicroserviceHealthIndicatorOptions;

  constructor(
    private readonly health: HealthCheckService,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly census: Stream.Client,
    config: ConfigService,
  ) {
    this.rabbitmqConfig = {
      transport: Transport.RMQ,
      options: {
        urls: config.get('RABBITMQ_URLS'),
      },
    };
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.microservice.pingCheck('rabbitmq', this.rabbitmqConfig),
      () => {
        const status = this.census.isReady;
        const result: HealthIndicatorResult = {
          census: { status: status ? 'up' : 'down' },
        };

        if (status) return result;

        throw new HealthCheckError('Not connected to Census', result);
      },
    ]);
  }
}
