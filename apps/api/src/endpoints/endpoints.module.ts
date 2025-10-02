import { Module } from '@nestjs/common';
import { EndpointsController } from './endpoints.controller';
import { EndpointsService } from './endpoints.service';
import { PathService } from './path.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EndpointsController],
  providers: [EndpointsService, PathService],
  exports: [EndpointsService],
})
export class EndpointsModule {}
