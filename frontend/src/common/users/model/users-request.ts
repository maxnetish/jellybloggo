import { Role } from '../../auth/model/user-role';

/**
 * Параметры фильтрации для списика пользователей
 */
export interface UsersRequest {
  /**
   * Роли
   */
  roles?: Role[];
  /**
   * Поисковая строка
   */
  search?: string;
}
