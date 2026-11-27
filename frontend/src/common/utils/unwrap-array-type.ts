/**
 * extract type of array element
 */
export type UnwrapArrayType<T> = T extends (infer U)[] ? U : never;
