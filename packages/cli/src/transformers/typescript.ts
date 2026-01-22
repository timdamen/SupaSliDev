import {
  Project,
  SourceFile,
  SyntaxKind,
  IndentationText,
  Node,
  type ObjectLiteralExpression,
  type ArrayLiteralExpression,
  type PropertyAssignment,
  type ImportDeclaration,
  type ExportDeclaration,
  type ExportAssignment,
} from 'ts-morph';

export interface TypeScriptTransformResult {
  changed: boolean;
  originalContent: string;
  newContent: string;
}

export interface TypeScriptTransformer {
  project: Project;
  sourceFile: SourceFile;
  save: () => TypeScriptTransformResult;
}

export function createTransformer(filePath: string): TypeScriptTransformer {
  const project = new Project({
    useInMemoryFileSystem: false,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      useTrailingCommas: true,
    },
  });

  const sourceFile = project.addSourceFileAtPath(filePath);
  const originalContent = sourceFile.getFullText();

  return {
    project,
    sourceFile,
    save: () => {
      const newContent = sourceFile.getFullText();
      const changed = originalContent !== newContent;

      if (changed) {
        sourceFile.saveSync();
      }

      return { changed, originalContent, newContent };
    },
  };
}

export function transformTypeScript(
  filePath: string,
  transformer: (sourceFile: SourceFile) => void,
): TypeScriptTransformResult {
  const { sourceFile, save } = createTransformer(filePath);
  transformer(sourceFile);
  return save();
}

export function addImport(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  namedImports: string[],
): ImportDeclaration | null {
  const existingImport = sourceFile.getImportDeclaration(moduleSpecifier);

  if (existingImport) {
    const existingNamedImports = existingImport.getNamedImports().map((n) => n.getName());
    const newImports = namedImports.filter((n) => !existingNamedImports.includes(n));

    if (newImports.length > 0) {
      existingImport.addNamedImports(newImports);
    }

    return existingImport;
  }

  return sourceFile.addImportDeclaration({
    moduleSpecifier,
    namedImports,
  });
}

export function removeImport(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  namedImports?: string[],
): boolean {
  const importDecl = sourceFile.getImportDeclaration(moduleSpecifier);

  if (!importDecl) {
    return false;
  }

  if (!namedImports) {
    importDecl.remove();
    return true;
  }

  const existingNamedImports = importDecl.getNamedImports();

  for (const namedImport of existingNamedImports) {
    if (namedImports.includes(namedImport.getName())) {
      namedImport.remove();
    }
  }

  const hasNamedImports = importDecl.getNamedImports().length > 0;
  const hasDefaultImport = !!importDecl.getDefaultImport();
  const hasNamespaceImport = !!importDecl.getNamespaceImport();

  if (!hasNamedImports && !hasDefaultImport && !hasNamespaceImport) {
    importDecl.remove();
  }

  return true;
}

export function addExport(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  namedExports: string[],
): ExportDeclaration {
  const existingExport = sourceFile
    .getExportDeclarations()
    .find((e) => e.getModuleSpecifierValue() === moduleSpecifier);

  if (existingExport) {
    const existingNamedExports = existingExport.getNamedExports().map((e) => e.getName());
    const newExports = namedExports.filter((e) => !existingNamedExports.includes(e));

    if (newExports.length > 0) {
      existingExport.addNamedExports(newExports);
    }

    return existingExport;
  }

  return sourceFile.addExportDeclaration({
    moduleSpecifier,
    namedExports,
  });
}

export function findObjectLiteral(
  sourceFile: SourceFile,
  variableName: string,
): ObjectLiteralExpression | undefined {
  const variable = sourceFile.getVariableDeclaration(variableName);

  if (!variable) {
    return undefined;
  }

  const initializer = variable.getInitializer();

  if (initializer?.getKind() === SyntaxKind.ObjectLiteralExpression) {
    return initializer as ObjectLiteralExpression;
  }

  return undefined;
}

export function findArrayLiteral(
  sourceFile: SourceFile,
  variableName: string,
): ArrayLiteralExpression | undefined {
  const variable = sourceFile.getVariableDeclaration(variableName);

  if (!variable) {
    return undefined;
  }

  const initializer = variable.getInitializer();

  if (initializer?.getKind() === SyntaxKind.ArrayLiteralExpression) {
    return initializer as ArrayLiteralExpression;
  }

  return undefined;
}

export function getObjectProperty(
  obj: ObjectLiteralExpression,
  propertyName: string,
): PropertyAssignment | undefined {
  const property = obj.getProperty(propertyName);

  if (property && Node.isPropertyAssignment(property)) {
    return property;
  }

  return undefined;
}

export function setObjectProperty(
  obj: ObjectLiteralExpression,
  propertyName: string,
  value: string,
): void {
  const existing = getObjectProperty(obj, propertyName);

  if (existing) {
    existing.setInitializer(value);
  } else {
    obj.addPropertyAssignment({
      name: propertyName,
      initializer: value,
    });
  }
}

export function removeObjectProperty(obj: ObjectLiteralExpression, propertyName: string): boolean {
  const property = obj.getProperty(propertyName);

  if (property) {
    property.remove();
    return true;
  }

  return false;
}

export function addArrayElement(arr: ArrayLiteralExpression, element: string): void {
  arr.addElement(element);
}

export function removeArrayElement(arr: ArrayLiteralExpression, element: string): boolean {
  const elements = arr.getElements();

  for (const el of elements) {
    if (el.getText() === element) {
      arr.removeElement(el);
      return true;
    }
  }

  return false;
}

export function findDefaultExportObject(
  sourceFile: SourceFile,
): ObjectLiteralExpression | undefined {
  const defaultExport = sourceFile.getDefaultExportSymbol();

  if (!defaultExport) {
    return undefined;
  }

  const declarations = defaultExport.getDeclarations();

  for (const decl of declarations) {
    if (Node.isExportAssignment(decl)) {
      const expression = (decl as ExportAssignment).getExpression();
      if (expression.getKind() === SyntaxKind.ObjectLiteralExpression) {
        return expression as ObjectLiteralExpression;
      }
    }
  }

  return undefined;
}

export function findCallExpression(
  sourceFile: SourceFile,
  functionName: string,
): ObjectLiteralExpression | undefined {
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const call of callExpressions) {
    const expression = call.getExpression();
    if (expression.getText() === functionName) {
      const args = call.getArguments();
      if (args.length > 0 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
        return args[0] as ObjectLiteralExpression;
      }
    }
  }

  return undefined;
}
