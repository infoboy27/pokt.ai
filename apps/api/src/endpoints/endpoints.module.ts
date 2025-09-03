import { Module } from '@nestjs/common';
import { EndpointsController } from './endpoints.controller';
import { EndpointsService } from './endpoints.service';
import { PathService } from './path.service';

@Module({
  controllers: [EndpointsController],
  providers: [EndpointsService, PathService],
  exports: [EndpointsService],
})
export class EndpointsModule {}
