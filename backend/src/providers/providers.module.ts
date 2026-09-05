import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators/modules/global.decorator';
import { HttpCustomService } from './http/http.service.js';
import { EmailService } from './email/email.service.js';

@Global()
@Module({
  imports: [HttpModule],
  providers: [HttpCustomService, EmailService],
  exports: [HttpCustomService, HttpModule, EmailService],
})
export class ProvidersModule {}
