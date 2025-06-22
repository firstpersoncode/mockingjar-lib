import { JsonSchema, SchemaField } from '@/types/schema';
import { v4 as uuidv4 } from 'uuid';

export interface GenerateSchemaPreviewOptions {
  collapsedFields?: Set<string>;
  forPreview?: boolean;
}

export const convertSchemaFieldToJson = (
  field: SchemaField,
  configs: GenerateSchemaPreviewOptions = {}
): unknown => {
  const { collapsedFields = new Set(), forPreview = false } = configs;
  switch (field.type) {
    case 'text':
      if (field.logic?.enum) {
        return `text enum: ${field.logic.enum.join(', ')}`;
      }
      if (field.logic?.pattern) {
        return `text pattern: ${field.logic.pattern}`;
      }
      if (field.logic?.minLength || field.logic?.maxLength) {
        const min = field.logic.minLength;
        const max = field.logic.maxLength;
        if (min && max) {
          return `text with minimum ${min} and maximum ${max} characters`;
        } else if (min) {
          return `text with minimum ${min} characters`;
        } else if (max) {
          return `text with maximum ${max} characters`;
        }
      }
      return 'text';
    case 'email':
      if (field.logic?.minLength || field.logic?.maxLength) {
        const min = field.logic.minLength;
        const max = field.logic.maxLength;
        if (min && max) {
          return `email with minimum ${min} and maximum ${max} characters`;
        } else if (min) {
          return `email with minimum ${min} characters`;
        } else if (max) {
          return `email with maximum ${max} characters`;
        }
      }
      return 'email';
    case 'url':
      return 'url';
    case 'number':
      if (field.logic?.enum) {
        return `number enum: ${field.logic.enum.join(', ')}`;
      }
      if (field.logic?.min !== undefined || field.logic?.max !== undefined) {
        const min = field.logic.min;
        const max = field.logic.max;
        if (min !== undefined && max !== undefined) {
          return `number between ${min} and ${max}`;
        } else if (min !== undefined) {
          return `number minimum ${min}`;
        } else if (max !== undefined) {
          return `number maximum ${max}`;
        }
      }
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    case 'array':
      const items = [];
      const logic = field.logic;

      // Generate minimum required items
      const minItems = logic?.minItems || 2;
      const maxItems = logic?.maxItems || 5;

      // Create sample items based on constraints
      const sampleCount = forPreview ? 1 : Math.min(minItems + 1, maxItems);
      for (let i = 0; i < sampleCount; i++) {
        items.push(convertSchemaFieldToJson(field.arrayItemType!, configs));
      }

      // Show collapsed indicator if field is collapsed and has arrayItemType
      if (collapsedFields.has(field.id) && field.arrayItemType) {
        return `[ ...${items.length} item${items.length !== 1 ? 's' : ''} ]`;
      }

      return items;
    case 'object':
      const obj: Record<string, unknown> = {};

      // Show collapsed indicator instead of children if field is collapsed
      if (
        collapsedFields.has(field.id) &&
        field.children &&
        field.children.length > 0
      ) {
        return `{ ...${field.children.length} field${
          field.children.length !== 1 ? 's' : ''
        } }`;
      }

      if (field.children && field.children.length > 0) {
        // Track used keys to handle duplicates
        const usedKeys = new Set<string>();

        field.children.forEach((child) => {
          let keyName = child.name;

          // Handle duplicate keys by appending a number
          if (usedKeys.has(keyName)) {
            let counter = 2;
            while (usedKeys.has(`${keyName}_${counter}`)) {
              counter++;
            }
            keyName = `${keyName}_${counter}`;
          }

          usedKeys.add(keyName);
          obj[keyName] = convertSchemaFieldToJson(child, configs);
        });
      }
      return obj;
    default:
      return 'unknown';
  }
};

export const convertSchemaToJson = (
  schema: JsonSchema,
  configs: GenerateSchemaPreviewOptions = {}
): Record<string, unknown> => {
  const preview: Record<string, unknown> = {};
  const usedTopLevelKeys = new Set<string>();
  const fields = schema.fields || [];

  fields.forEach((field) => {
    let keyName = field.name;

    // Handle duplicate keys by appending a number
    if (usedTopLevelKeys.has(keyName)) {
      let counter = 2;
      while (usedTopLevelKeys.has(`${keyName}_${counter}`)) {
        counter++;
      }
      keyName = `${keyName}_${counter}`;
    }

    usedTopLevelKeys.add(keyName);
    preview[keyName] = convertSchemaFieldToJson(field, configs);
  });

  return preview;
};

/**
 * Find and update a field by ID anywhere in the nested structure
 */
export const findAndUpdateField = (
  fields: SchemaField[],
  targetId: string,
  updater: (field: SchemaField) => SchemaField
): SchemaField[] => {
  return fields.map((field) => {
    if (field.id === targetId) {
      return updater(field);
    }

    // Check children
    if (field.children) {
      const updatedChildren = findAndUpdateField(
        field.children,
        targetId,
        updater
      );
      if (updatedChildren !== field.children) {
        return { ...field, children: updatedChildren };
      }
    }

    // Check arrayItemType
    if (field.arrayItemType) {
      if (field.arrayItemType.id === targetId) {
        return { ...field, arrayItemType: updater(field.arrayItemType) };
      }

      // Check arrayItemType's children
      if (field.arrayItemType.children) {
        const updatedArrayItemChildren = findAndUpdateField(
          field.arrayItemType.children,
          targetId,
          updater
        );
        if (updatedArrayItemChildren !== field.arrayItemType.children) {
          return {
            ...field,
            arrayItemType: {
              ...field.arrayItemType,
              children: updatedArrayItemChildren,
            },
          };
        }
      }

      // Check nested arrayItemType (for Array -> Array scenarios)
      if (field.arrayItemType.arrayItemType) {
        const nestedResult = findAndUpdateField(
          [field.arrayItemType],
          targetId,
          updater
        );
        if (nestedResult[0] !== field.arrayItemType) {
          return { ...field, arrayItemType: nestedResult[0] };
        }
      }
    }

    return field;
  });
};

/**
 * Find and remove a field by ID anywhere in the nested structure
 */
export const findAndRemoveField = (
  fields: SchemaField[],
  targetId: string
): SchemaField[] => {
  return fields
    .filter((field) => field.id !== targetId)
    .map((field) => {
      // Check children
      if (field.children) {
        const updatedChildren = findAndRemoveField(field.children, targetId);
        if (updatedChildren.length !== field.children.length) {
          return { ...field, children: updatedChildren };
        }
      }

      // Check arrayItemType children
      if (field.arrayItemType?.children) {
        const updatedArrayItemChildren = findAndRemoveField(
          field.arrayItemType.children,
          targetId
        );
        if (
          updatedArrayItemChildren.length !==
          field.arrayItemType.children.length
        ) {
          return {
            ...field,
            arrayItemType: {
              ...field.arrayItemType,
              children: updatedArrayItemChildren,
            },
          };
        }
      }

      // Check nested arrayItemType
      if (field.arrayItemType?.arrayItemType) {
        const nestedResult = findAndRemoveField(
          [field.arrayItemType],
          targetId
        );
        if (
          nestedResult.length === 0 ||
          nestedResult[0] !== field.arrayItemType
        ) {
          return { ...field, arrayItemType: nestedResult[0] };
        }
      }

      return field;
    });
};

/**
 *
 * UI Utilities for Schema Fields
 * These functions are used to create, update, and manipulate schema fields in the UI.
 */

export const addField = (schema: JsonSchema): JsonSchema => {
  const newField: SchemaField = {
    id: uuidv4(),
    name: 'newField',
    type: 'text',
    logic: { required: false },
  };

  return {
    ...schema,
    fields: [...schema.fields, newField],
  };
};

export const addObjectField = (
  targetId: string,
  schema: JsonSchema
): JsonSchema => {
  const newChild: SchemaField = {
    id: uuidv4(),
    name: 'newField',
    type: 'text',
    logic: { required: false },
  };

  return {
    ...schema,
    fields: findAndUpdateField(schema.fields, targetId, (field) => ({
      ...field,
      children: [...(field.children || []), newChild],
    })),
  };
};

export const addArrayItemObjectField = (
  targetId: string,
  schema: JsonSchema
): JsonSchema => {
  const newChild: SchemaField = {
    id: uuidv4(),
    name: 'newField',
    type: 'text',
    logic: { required: false },
  };

  return {
    ...schema,
    fields: findAndUpdateField(schema.fields, targetId, (field) => {
      const updatedArrayItem = {
        ...field.arrayItemType!,
        children: [...(field.arrayItemType!.children || []), newChild],
      };

      return {
        ...field,
        arrayItemType: updatedArrayItem,
      };
    }),
  };
};

export const handleSchemaSelected = (
  targetId: string,
  schema: JsonSchema,
  selectedSchema: JsonSchema
): JsonSchema => {
  // Update the schema state to populate the target field with selected schema's fields
  // Helper function to convert to PascalCase
  const toPascalCase = (str: string): string => {
    return str
      .replace(/\s+/g, ' ') // Normalize whitespace
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };

  return {
    ...schema,
    fields: findAndUpdateField(schema.fields, targetId, (field) => {
      if (field.type === 'array' && field.arrayItemType) {
        // If the field is an array, we need to update the array item type
        return {
          ...field,
          arrayItemType: {
            ...field.arrayItemType,
            type: 'object',
            name:
              field.arrayItemType.name === 'newField'
                ? toPascalCase(selectedSchema.name)
                : field.arrayItemType.name,
            children: selectedSchema.fields.filter((f) => f.id !== targetId),
          },
        };
      }

      return {
        ...field,
        type: 'object',
        name:
          field.name === 'newField'
            ? toPascalCase(selectedSchema.name)
            : field.name,
        children: selectedSchema.fields.filter((f) => f.id !== targetId),
      };
    }),
  };
};

export const updateField = (
  targetId: string,
  updates: Partial<SchemaField>,
  schema: JsonSchema
): JsonSchema => {
  return {
    ...schema,
    fields: findAndUpdateField(schema.fields, targetId, (field) => ({
      ...field,
      ...updates,
    })),
  };
};

export const updateFieldType = (
  targetId: string,
  newType: SchemaField['type'],
  schema: JsonSchema,
  selectedSchema?: JsonSchema
): JsonSchema => {
  if (newType === 'schema' && selectedSchema) {
    return handleSchemaSelected(targetId, schema, selectedSchema);
  }

  const updates: Partial<SchemaField> = { type: newType };

  if (newType === 'object') {
    updates.children = [];
  } else {
    updates.children = undefined;
  }

  if (newType === 'array') {
    updates.arrayItemType = {
      id: uuidv4(),
      name: 'item',
      type: 'text',
      children: undefined,
      arrayItemType: undefined,
      logic: { required: false },
    };
  } else {
    updates.arrayItemType = undefined;
  }

  return {
    ...schema,
    fields: findAndUpdateField(schema.fields, targetId, (field) => ({
      ...field,
      ...updates,
    })),
  };
};

export const updateArrayItemFieldType = (
  targetId: string,
  newItemType: SchemaField['type'],
  schema: JsonSchema,
  selectedSchema?: JsonSchema
): JsonSchema => {
  if (newItemType === 'schema' && selectedSchema) {
    return handleSchemaSelected(targetId, schema, selectedSchema);
  }

  return {
    ...schema,
    fields: findAndUpdateField(schema.fields, targetId, (field) => ({
      ...field,
      arrayItemType: {
        id: field.arrayItemType?.id || uuidv4(),
        name: field.arrayItemType?.name || 'item',
        type: newItemType,
        children:
          newItemType === 'object'
            ? field.arrayItemType?.children || []
            : undefined,
        arrayItemType:
          newItemType === 'array'
            ? ({
                id: uuidv4(),
                name: 'item',
                type: 'text',
                children: undefined,
                arrayItemType: undefined,
                logic: { required: false },
              } as SchemaField)
            : undefined,
        logic: field.arrayItemType?.logic || {
          required: false,
        },
      } as SchemaField,
    })),
  };
};

export const deleteField = (
  targetId: string,
  schema: JsonSchema
): JsonSchema => {
  return {
    ...schema,
    fields: findAndRemoveField(schema.fields, targetId),
  };
};
