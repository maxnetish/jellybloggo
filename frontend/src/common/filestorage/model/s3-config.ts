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
   * Название S3-бакета, в который загружаются файлы.
   * Пример: "my-blog-uploads", "media-bucket".
   */
  s3_bucket: string;

  /**
   * Публичный базовый URL для доступа к загруженным файлам.
   * Формируется как `{s3_public_end_point}/{имя_файла}`.
   * Пример: "https://cdn.example.com", "https://storage.example.com/bucket"
   */
  s3_public_end_point: string;

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

  /**
   * Название S3-бакета.
   * Обязательно, max 63 символа.
   */
  s3_bucket: string;

  /**
   * Публичный базовый URL для доступа к файлам.
   * Обязательно, должен быть валидным URL, max 500 символов.
   */
  s3_public_end_point: string;
}

/**
 * Тело запроса для PUT /api/s3-configs/{id} (обновление конфигурации).
 * Поля credentials и name опциональны — передаются только изменяемые.
 * Поля s3_bucket и s3_public_end_point обязательны при обновлении.
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

  /**
   * Новое название S3-бакета (обязательно).
   */
  s3_bucket: string;

  /**
   * Новый публичный базовый URL (обязательно).
   */
  s3_public_end_point: string;
}