import { Attachment } from './attachment.interface.js';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: { email: string; name?: string };
  attachments?: Attachment[];
  category?: string;
}
