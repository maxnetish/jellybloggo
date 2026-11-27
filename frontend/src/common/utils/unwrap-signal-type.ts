import { Signal } from '@angular/core';

/**
 * Extract type of signal value
 */
export type UnwrapSignalType<T> = T extends Signal<infer U> ? U : never;
