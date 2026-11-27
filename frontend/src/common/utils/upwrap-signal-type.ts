import { Signal } from '@angular/core';

/**
 * Extract type of signal value
 */
export type UpwrapSignalType<T> = T extends Signal<infer U> ? U : never;
