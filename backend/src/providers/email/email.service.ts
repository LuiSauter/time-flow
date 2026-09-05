import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpCustomService } from '../http/http.service.js';
import { SendMailOptions } from './interfaces/sendMailOptions.interface.js';

interface ProviderPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: { email: string; name?: string };
  attachments?: any[];
  category?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mailerBase: string;
  private readonly mailerKey: string;

  private disabled = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpCustomService,
  ) {
    this.mailerBase = this.configService.get<string>('MAILER_SERVICE') || '';
    this.mailerKey = this.configService.get<string>('MAILER_SECRET_KEY') || '';

    if (!this.mailerBase || !this.mailerKey) {
      // In test/dev we avoid throwing to not break test bootstrap — mark service disabled and log.
      this.disabled = true;
      this.logger.warn(
        'MAILER_SERVICE or MAILER_SECRET_KEY not set — email sending disabled',
      );
      return;
    }

    this.logger.log(`EmailService initialized using ${this.mailerBase}`);
  }

  /**
   * Send an email using the configured mailer provider.
   * - Keeps a simple boolean return for backward compatibility
   * - Accepts `to` as string|string[] and optional `text`/`from`/`attachments`
   */
  public async sendEmail(options: SendMailOptions): Promise<boolean> {
    // use a simple `rest` capture (TS doesn't allow typed rest inside destructuring)
    const { to, subject, html, attachments, ...rest } =
      options as any as Record<string, any>;

    if (!to || !subject || (!html && !rest?.text)) {
      this.logger.warn(
        'sendEmail called with missing required fields (to, subject, html/text)',
      );
      return false;
    }

    const payload: ProviderPayload = {
      to: Array.isArray(to) ? (to as string[]).join(',') : (to as string),
      subject,
      html,
      text: rest?.text,
      from: rest?.from,
      attachments: attachments as any[] | undefined,
      category: rest?.category || 'application',
    };

    const endpoint = `${this.mailerBase.replace(/\/$/, '')}/send-email`;

    try {
      this.logger.debug(`Sending email to: ${payload.to}`);
      const resp = await this.httpService.post<any>(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.mailerKey,
        },
      });

      // provider expected to return success/messageId — be permissive
      if (resp && (resp.success === true || resp.messageId || resp.id)) {
        this.logger.log(
          `Email sent to ${payload.to} (id=${resp.messageId ?? resp.id ?? 'unknown'})`,
        );
        return true;
      }

      this.logger.warn(
        'Email provider returned unexpected response',
        JSON.stringify(resp),
      );
      return false;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown email provider error';
      this.logger.error(`Error sending email: ${message}`);
      return false;
    }
  }
}
