/**
 * Ответ от GET /api/s3-configs и GET /api/s3-configs/{id}.
 *
 * @see backend/internal/s3config/model.go:S3ConfigResponse
 */
export interface S3ConfigResponse {
  /**
   * Уникальный идентификатор конфигурации (UUID).
   */
  id: string;

  /**
   * Читаемое имя конфигурации, заданное пользователем.
   * Пример: "My S3 Bucket", "Production Minio".
   */
  config_name: string;

  /**
   * Access Key ID для доступа к S3-совместимому хранилищу.
   * Расшифрованное значение (бэк хранит зашифрованным).
   * Используется для подписи запросов к S3.
   */
  s3_access_key: string;

  /**
   * Secret Access Key для доступа к S3-совместимому хранилищу.
   * Расшифрованное значение (бэк хранит зашифрованным).
   * Используется для подписи запросов к S3.
   * Никогда не логировать и не отправлять на сторонние сервисы.
   */
  s3_access_secret: string;

  /**
   * Кастомный S3-эндпоинт (например, для Minio, DigitalOcean Spaces, Yandex Cloud).
   * null, если используется стандартный AWS S3.
   * Пример: "https://minio.example.com"
   */
  s3_endpoint: string | null;

  /**
   * Регион S3-хранилища.
   * Пример: "us-east-1", "ru-central1".
   * null, если эндпоинт не подразумевает регион (например, Minio single-node).
   */
  s3_region: string | null;

  /**
   * Время создания конфигурации (RFC3339).
   */
  created_at: string;

  /**
   * Время последнего обновления конфигурации (RFC3339).
   */
  updated_at: string;
}

/**
 * Тело запроса для POST /api/s3-configs (создание новой конфигурации).
 *
 * @see backend/internal/s3config/model.go:CreateS3ConfigRequest
 */
export interface CreateS3ConfigRequest {
  /**
   * Читаемое имя конфигурации.
   * Обязательно, max 100 символов.
   */
  config_name: string;

  /**
   * Access Key ID.
   * Обязательно, max 255 символов.
   */
  s3_access_key: string;

  /**
   * Secret Access Key.
   * Обязательно, max 500 символов.
   */
  s3_access_secret: string;

  /**
   * Кастомный S3-эндпоинт (опционально).
   * Если не указан — используется стандартный AWS S3.
   */
  s3_endpoint?: string | null;

  /**
   * Регион S3-хранилища (опционально).
   */
  s3_region?: string | null;
}

/**
 * Тело запроса для PUT /api/s3-configs/{id} (обновление конфигурации).
 * Все поля опциональны — передаются только те, которые нужно изменить.
 *
 * @see backend/internal/s3config/model.go:UpdateS3ConfigRequest
 */
export interface UpdateS3ConfigRequest {
  /**
   * Новое имя конфигурации (опционально).
   */
  config_name?: string | null;

  /**
   * Новый Access Key ID (опционально).
   */
  s3_access_key?: string | null;

  /**
   * Новый Secret Access Key (опционально).
   */
  s3_access_secret?: string | null;

  /**
   * Новый кастомный эндпоинт (опционально, null — сбросить на стандартный).
   */
  s3_endpoint?: string | null;

  /**
   * Новый регион (опционально, null — сбросить).
   */
  s3_region?: string | null;
}