import i18n from '@/i18n/setup';
import { createMockDataSource } from '@/data/sources/mock/mock-data-source';

/**
 * Único punto donde se elige la implementación de datos. Cuando exista el backend, aquí se
 * sustituye `createMockDataSource` por una implementación `http`.
 */
export const dataSource = createMockDataSource((key) => i18n.t(key));
