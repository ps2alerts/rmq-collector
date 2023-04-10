import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { CensusModule } from '../census/census.module';

@Module({ imports: [TerminusModule.forRoot(), CensusModule] })
export class HealthModule {}
