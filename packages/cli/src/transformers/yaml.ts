import { readFileSync, writeFileSync } from 'node:fs';
import { parse, stringify, parseDocument, type Document, type ParseOptions } from 'yaml';

export interface YamlTransformResult<T = unknown> {
  original: T;
  transformed: T;
  changed: boolean;
}

const defaultParseOptions: ParseOptions = {
  keepSourceTokens: true,
};

export function readYamlFile<T = unknown>(filePath: string): T {
  const content = readFileSync(filePath, 'utf-8');
  return parse(content) as T;
}

export function writeYamlFile<T>(filePath: string, data: T): void {
  const content = stringify(data);
  writeFileSync(filePath, content, 'utf-8');
}

export function readYamlDocument(filePath: string): Document {
  const content = readFileSync(filePath, 'utf-8');
  return parseDocument(content, defaultParseOptions);
}

export function writeYamlDocument(filePath: string, doc: Document): void {
  writeFileSync(filePath, doc.toString(), 'utf-8');
}

export function transformYaml<T = unknown>(
  filePath: string,
  transformer: (data: T) => T,
): YamlTransformResult<T> {
  const original = readYamlFile<T>(filePath);
  const transformed = transformer(structuredClone(original));
  const changed = stringify(original) !== stringify(transformed);

  if (changed) {
    writeYamlFile(filePath, transformed);
  }

  return { original, transformed, changed };
}

export function transformYamlDocument(
  filePath: string,
  transformer: (doc: Document) => void,
): { changed: boolean } {
  const doc = readYamlDocument(filePath);
  const originalContent = doc.toString();

  transformer(doc);

  const newContent = doc.toString();
  const changed = originalContent !== newContent;

  if (changed) {
    writeFileSync(filePath, newContent, 'utf-8');
  }

  return { changed };
}

export function getYamlValue<T = unknown>(data: unknown, path: string): T | undefined {
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

export function setYamlValue<T>(data: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = structuredClone(data);
  let current: Record<string, unknown> = result as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

export function deleteYamlValue<T>(data: T, path: string): T {
  const keys = path.split('.');
  const result = structuredClone(data);
  let current: Record<string, unknown> = result as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      return result;
    }
    current = current[key] as Record<string, unknown>;
  }

  delete current[keys[keys.length - 1]];
  return result;
}

export function mergeYaml<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
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
      result[key] = mergeYaml(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      result[key] = structuredClone(sourceValue) as T[keyof T];
    }
  }

  return result;
}
