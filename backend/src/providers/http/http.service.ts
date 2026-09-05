import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { toAppError } from '../../common/errors/index.js';

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

@Injectable()
export class HttpCustomService {
  constructor(private readonly httpService: HttpService) {}

  public async get<T>(url: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          headers: config?.headers,
          params: config?.params,
        }),
      );
      return response.data;
    } catch (error: unknown) {
      throw toAppError(error, `Error en la solicitud GET: ${url}`);
    }
  }

  public async post<TResponse, TBody = unknown>(
    url: string,
    data: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<TResponse>(url, data, {
          headers: config?.headers,
          params: config?.params,
        }),
      );
      return response.data;
    } catch (error: unknown) {
      throw toAppError(error, `Error en la solicitud POST: ${url}`);
    }
  }

  public async apiGetAll<T>(url: string): Promise<T> {
    return this.get<T>(url);
  }

  public async apiCheckTokenGoogle<T>(url: string): Promise<T> {
    return this.get<T>(url);
  }
}
