import { readFileSync, writeFileSync } from 'node:fs';

export interface JsonTransformResult<T = unknown> {
  original: T;
  transformed: T;
  changed: boolean;
}

export function readJsonFile<T = unknown>(filePath: string): T {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export function writeJsonFile<T>(filePath: string, data: T, indent = 2): void {
  const content = JSON.stringify(data, null, indent) + '\n';
  writeFileSync(filePath, content, 'utf-8');
}

export function transformJson<T = unknown>(
  filePath: string,
  transformer: (data: T) => T,
): JsonTransformResult<T> {
  const original = readJsonFile<T>(filePath);
  const transformed = transformer(structuredClone(original));
  const changed = JSON.stringify(original) !== JSON.stringify(transformed);

  if (changed) {
    writeJsonFile(filePath, transformed);
  }

  return { original, transformed, changed };
}

export function getJsonValue<T = unknown>(data: unknown, path: string): T | undefined {
  const keys = path.split('.');
  let current: unknown = data;

  for (const key of keys) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

export function setJsonValue<T>(data: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = structuredClone(data);
  let current: Record<string, unknown> | unknown[] = result as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextKeyNumeric = /^\d+$/.test(nextKey);

    if (Array.isArray(current)) {
      const index = parseInt(key, 10);
      if (isNaN(index)) {
        throw new Error(
          `Cannot use non-numeric key "${key}" on array at path "${keys.slice(0, i).join('.')}"`,
        );
      }
      if (
        current[index] === undefined ||
        current[index] === null ||
        typeof current[index] !== 'object'
      ) {
        current[index] = isNextKeyNumeric ? [] : {};
      }
      current = current[index] as Record<string, unknown> | unknown[];
    } else {
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        current[key] = isNextKeyNumeric ? [] : {};
      } else if (Array.isArray(current[key]) && !isNextKeyNumeric) {
        throw new Error(
          `Cannot use non-numeric key "${nextKey}" on array at path "${keys.slice(0, i + 1).join('.')}"`,
        );
      }
      current = current[key] as Record<string, unknown> | unknown[];
    }
  }

  const finalKey = keys[keys.length - 1];
  if (Array.isArray(current)) {
    const index = parseInt(finalKey, 10);
    if (isNaN(index)) {
      throw new Error(`Cannot use non-numeric key "${finalKey}" on array`);
    }
    current[index] = value;
  } else {
    current[finalKey] = value;
  }

  return result;
}

export function deleteJsonValue<T>(data: T, path: string): T {
  const keys = path.split('.');
  const result = structuredClone(data);
  let current: Record<string, unknown> | unknown[] = result as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (Array.isArray(current)) {
      const index = parseInt(key, 10);
      if (
        isNaN(index) ||
        current[index] === undefined ||
        current[index] === null ||
        typeof current[index] !== 'object'
      ) {
        return result;
      }
      current = current[index] as Record<string, unknown> | unknown[];
    } else {
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        return result;
      }
      current = current[key] as Record<string, unknown> | unknown[];
    }
  }

  const finalKey = keys[keys.length - 1];
  if (Array.isArray(current)) {
    const index = parseInt(finalKey, 10);
    if (!isNaN(index) && index < current.length) {
      current.splice(index, 1);
    }
  } else {
    delete current[finalKey];
  }

  return result;
}

export function mergeJson<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = structuredClone(target);

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = mergeJson(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      result[key] = structuredClone(sourceValue) as T[keyof T];
    }
  }

  return result;
}
