/**
 * Re-export ConfigType qua namespace import để tránh lỗi TS1272
 * khi dùng isolatedModules + emitDecoratorMetadata.
 *
 * Dùng: `import { NsConfigType } from '../config/config.types';`
 */
import * as NestConfig from '@nestjs/config';

export type NsConfigType<T extends (...args: any) => any> =
  NestConfig.ConfigType<T>;
