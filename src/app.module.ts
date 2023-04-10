import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  makeCounterProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { MessageController } from './controllers/message.controller';
import { config } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [config],
    }),
    PrometheusModule.register(),
    RabbitmqModule,
  ],
  providers: [
    makeCounterProvider({
      name: 'ess_message_count',
      help: 'Messages received from Census ESS',
      labelNames: ['event_name', 'world_id'],
    }),
  ],
  controllers: [MessageController],
})
export class AppModule {}
