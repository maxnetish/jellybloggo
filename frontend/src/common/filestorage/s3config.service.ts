import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  S3ConfigResponse,
  CreateS3ConfigRequest,
  UpdateS3ConfigRequest,
} from './model/s3-config';

/**
 * Сервис для управления S3-конфигурациями пользователя.
 *
 * Позволяет создавать, читать, обновлять и удалять S3-конфигурации,
 * используемые для загрузки файлов в S3-совместимые хранилища.
 * Параметры доступа (access_key, secret) расшифровываются бэком при отправке клиенту.
 */
@Injectable({
  providedIn: 'root',
})
export class S3ConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/s3-configs`;

  /**
   * Возвращает список всех S3-конфигураций текущего пользователя.
   *
   * @returns Observable<S3ConfigResponse[]> — массив конфигураций
   *
   * @see backend/internal/s3config/handler.go — метод ListConfigs
   * @see GET /api/s3-configs
   */
  getAll(): Observable<S3ConfigResponse[]> {
    return this.http.get<S3ConfigResponse[]>(this.baseUrl);
  }

  /**
   * Возвращает одну S3-конфигурацию по её ID.
   *
   * @param params.id — UUID конфигурации
   * @returns Observable<S3ConfigResponse>
   *
   * @see backend/internal/s3config/handler.go — метод GetConfig
   * @see GET /api/s3-configs/{id}
   */
  getById({ id }: { id: string }): Observable<S3ConfigResponse> {
    return this.http.get<S3ConfigResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Создаёт новую S3-конфигурацию для текущего пользователя.
   *
   * @param params.request — данные новой конфигурации
   * @returns Observable<S3ConfigResponse> — созданная конфигурация
   *
   * @see backend/internal/s3config/handler.go — метод CreateConfig
   * @see POST /api/s3-configs
   */
  create({ request }: { request: CreateS3ConfigRequest }): Observable<S3ConfigResponse> {
    return this.http.post<S3ConfigResponse>(this.baseUrl, request);
  }

  /**
   * Обновляет существующую S3-конфигурацию.
   * Все поля в request опциональны — передаются только изменяемые.
   *
   * @param params.id — UUID конфигурации
   * @param params.request — поля для обновления
   * @returns Observable<S3ConfigResponse> — обновлённая конфигурация
   *
   * @see backend/internal/s3config/handler.go — метод UpdateConfig
   * @see PUT /api/s3-configs/{id}
   */
  update({ id, request }: { id: string; request: UpdateS3ConfigRequest }): Observable<S3ConfigResponse> {
    return this.http.put<S3ConfigResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Удаляет S3-конфигурацию по ID.
   *
   * @param params.id — UUID конфигурации
   * @returns Observable<void>
   *
   * @see backend/internal/s3config/handler.go — метод DeleteConfig
   * @see DELETE /api/s3-configs/{id}
   */
  delete({ id }: { id: string }): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}