import { JsonSchema, SchemaField } from '@/types/schema';

export interface ValidationError {
  parent: string | null;
  affectedField: string;
  reason: string;
  structure: SchemaField | null;
}

// Helper function to get nested field value from data using dot notation
function getFieldValue(data: Record<string, unknown>, fieldPath: string): unknown {
  if (!data || !fieldPath) return undefined;
  
  const parts = fieldPath.split('.');
  let current: unknown = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Handle array indices like "tags[0]"
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
        const obj = current as Record<string, unknown>;
        current = obj[arrayName];
        if (Array.isArray(current)) {
          const idx = parseInt(index);
          current = idx < current.length ? current[idx] : undefined;
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
        const obj = current as Record<string, unknown>;
        current = obj[part];
      } else {
        return undefined;
      }
    }
  }
  
  return current;
}

// Helper function to check if a field exists in data
function hasField(data: Record<string, unknown>, fieldPath: string): boolean {
  if (!data || !fieldPath) return false;
  
  const parts = fieldPath.split('.');
  let current: unknown = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return false;
    }
    
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
        const obj = current as Record<string, unknown>;
        if (!(arrayName in obj)) return false;
        current = obj[arrayName];
        if (!Array.isArray(current)) return false;
        const idx = parseInt(index);
        if (idx >= current.length) return false;
        current = current[idx];
      } else {
        return false;
      }
    } else {
      if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
        const obj = current as Record<string, unknown>;
        if (!(part in obj)) return false;
        current = obj[part];
      } else {
        return false;
      }
    }
  }
  
  return true;
}

// Main validation function
export function jsonValidator(data: Record<string, unknown>, schema: JsonSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Validate each field in the schema
  for (const field of schema.fields) {
    validateField(data, field, '', errors);
  }
  
  // Check for unidentified fields in the data
  checkUnidentifiedFields(data, schema.fields, '', errors);
  
  return errors;
}

// Recursive field validation
function validateField(
  data: Record<string, unknown>, 
  field: SchemaField, 
  parentPath: string, 
  errors: ValidationError[]
): void {
  const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;
  const value = getFieldValue(data, fieldPath);
  const exists = hasField(data, fieldPath);
  
  // Check if field should be required
  const isRequired = field.logic?.required || 
                    (field.type === 'object' && field.children && field.children.length > 0) ||
                    (field.type === 'array' && field.arrayItemType);
  
  // Check required fields
  if (isRequired && !exists) {
    errors.push({
      parent: parentPath || null,
      affectedField: fieldPath,
      reason: 'missing required field',
      structure: field
    });
    return;
  }
  
  // If field doesn't exist and is not required, skip validation
  if (!exists) return;
  
  // Validate field type and constraints
  validateFieldType(value, field, fieldPath, parentPath, errors);
  
  // Validate children for object types
  if (field.type === 'object' && field.children && value && typeof value === 'object') {
    for (const childField of field.children) {
      validateField(data, childField, fieldPath, errors);
    }
  }
  
  // Validate array items
  if (field.type === 'array' && field.arrayItemType && Array.isArray(value)) {
    validateArrayField(data, field, fieldPath, parentPath, errors);
  }
}

// Validate field type and constraints
function validateFieldType(
  value: unknown, 
  field: SchemaField, 
  fieldPath: string, 
  parentPath: string, 
  errors: ValidationError[]
): void {
  // Type validation
  switch (field.type) {
    case 'text':
      if (typeof value !== 'string') {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
      
    case 'number':
      if (typeof value !== 'number') {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
      
    case 'email':
      if (typeof value !== 'string' || !value.includes('@')) {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
      
    case 'url':
      if (typeof value !== 'string' || !value.startsWith('http')) {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
      
    case 'date':
      if (typeof value !== 'string' || isNaN(Date.parse(value))) {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
      
    case 'array':
      if (!Array.isArray(value)) {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
      
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'malformed type',
          structure: field
        });
        return;
      }
      break;
  }
  
  // Constraint validation
  if (field.logic) {
    validateFieldConstraints(value, field, fieldPath, parentPath, errors);
  }
}

// Validate field constraints (length, min/max, enum, etc.)
function validateFieldConstraints(
  value: unknown, 
  field: SchemaField, 
  fieldPath: string, 
  parentPath: string, 
  errors: ValidationError[]
): void {
  const logic = field.logic!;
  
  // String constraints
  if ((field.type === 'text' || field.type === 'email' || field.type === 'url') && typeof value === 'string') {
    if (logic.minLength && value.length < logic.minLength) {
      errors.push({
        parent: parentPath || null,
        affectedField: fieldPath,
        reason: `string too short (minimum ${logic.minLength} characters)`,
        structure: field
      });
    }
    
    if (logic.maxLength && value.length > logic.maxLength) {
      errors.push({
        parent: parentPath || null,
        affectedField: fieldPath,
        reason: `string too long (maximum ${logic.maxLength} characters)`,
        structure: field
      });
    }
    
    if (logic.enum && !logic.enum.includes(value)) {
      errors.push({
        parent: parentPath || null,
        affectedField: fieldPath,
        reason: 'value not allowed',
        structure: field
      });
    }
  }
  
  // Number constraints
  if (field.type === 'number' && typeof value === 'number') {
    if (logic.min !== undefined && value < logic.min) {
      errors.push({
        parent: parentPath || null,
        affectedField: fieldPath,
        reason: `number below minimum (${logic.min})`,
        structure: field
      });
    }
    
    if (logic.max !== undefined && value > logic.max) {
      errors.push({
        parent: parentPath || null,
        affectedField: fieldPath,
        reason: `number above maximum (${logic.max})`,
        structure: field
      });
    }
  }
  
  // Array constraints
  if (field.type === 'array' && Array.isArray(value)) {
    if (logic.minItems && value.length < logic.minItems) {
      errors.push({
        parent: parentPath || null,
        affectedField: fieldPath,
        reason: `array too short: minimum ${logic.minItems} items required`,
        structure: field
      });
    }
    
    if (logic.maxItems && value.length > logic.maxItems) {
      errors.push({
        parent: parentPath || null,
        affectedField: fieldPath,
        reason: `array too long: maximum ${logic.maxItems} items allowed`,
        structure: field
      });
    }
  }
}

// Validate array field and its items
function validateArrayField(
  data: Record<string, unknown> | unknown[], 
  field: SchemaField, 
  fieldPath: string, 
  parentPath: string, 
  errors: ValidationError[]
): void {
  const value = getFieldValue(data as Record<string, unknown>, fieldPath);
  if (!Array.isArray(value) || !field.arrayItemType) return;
  
  const initialErrorCount = errors.length;
  
  // Validate each array item
  for (let i = 0; i < value.length; i++) {
    const itemPath = `${fieldPath}[${i}]`;
    const itemValue = value[i];
    
    // Validate the array item against its schema
    validateFieldType(itemValue, field.arrayItemType, itemPath, fieldPath, errors);
    
    // If array item is an object, validate its children directly
    if (field.arrayItemType.type === 'object' && field.arrayItemType.children && 
        typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue)) {
      
      const itemObject = itemValue as Record<string, unknown>;
      
      for (const childField of field.arrayItemType.children) {
        const childFieldPath = `${itemPath}.${childField.name}`;
        const childValue = itemObject[childField.name];
        const childExists = childField.name in itemObject;
        
        // Check required fields
        if ((childField.logic?.required || childField.type === 'object' || childField.type === 'array') && !childExists) {
          errors.push({
            parent: itemPath,
            affectedField: childFieldPath,
            reason: 'missing required field',
            structure: childField
          });
          continue;
        }
        
        // If field doesn't exist and is not required, skip validation
        if (!childExists) continue;
        
        // Validate field type and constraints
        validateFieldType(childValue, childField, childFieldPath, itemPath, errors);
        
        // If child is an object, validate its children recursively
        if (childField.type === 'object' && childField.children && 
            typeof childValue === 'object' && childValue !== null && !Array.isArray(childValue)) {
          
          const childObject = childValue as Record<string, unknown>;
          for (const grandChildField of childField.children) {
            const grandChildPath = `${childFieldPath}.${grandChildField.name}`;
            const grandChildValue = childObject[grandChildField.name];
            const grandChildExists = grandChildField.name in childObject;
            
            // Check required fields
            if ((grandChildField.logic?.required || grandChildField.type === 'object' || grandChildField.type === 'array') && !grandChildExists) {
              errors.push({
                parent: childFieldPath,
                affectedField: grandChildPath,
                reason: 'missing required field',
                structure: grandChildField
              });
              continue;
            }
            
            if (!grandChildExists) continue;
            
            validateFieldType(grandChildValue, grandChildField, grandChildPath, childFieldPath, errors);
          }
        }
        
        // If child is an array, validate recursively
        if (childField.type === 'array' && childField.arrayItemType && Array.isArray(childValue)) {
          validateArrayField(data, childField, childFieldPath, itemPath, errors);
        }
      }
    }
    
    // If array item is an array, validate recursively
    if (field.arrayItemType.type === 'array' && field.arrayItemType.arrayItemType && Array.isArray(itemValue)) {
      validateArrayField(data, field.arrayItemType, itemPath, fieldPath, errors);
    }
  }
  
  // If any array items are invalid, mark the entire array as malformed
  if (errors.length > initialErrorCount) {
    errors.push({
      parent: parentPath || null,
      affectedField: fieldPath,
      reason: 'malformed type',
      structure: field
    });
  }
}

// Check for unidentified fields in the data
function checkUnidentifiedFields(
  data: Record<string, unknown>, 
  schemaFields: SchemaField[], 
  parentPath: string, 
  errors: ValidationError[]
): void {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return;
  
  const validFieldNames = schemaFields.map(field => field.name);
  
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      
      if (!validFieldNames.includes(key)) {
        errors.push({
          parent: parentPath || null,
          affectedField: fieldPath,
          reason: 'Unidentified field',
          structure: null
        });
      } else {
        // Recursively check nested objects
        const schemaField = schemaFields.find(field => field.name === key);
        const fieldValue = data[key];
        
        if (schemaField?.type === 'object' && schemaField.children && 
            typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue)) {
          checkUnidentifiedFields(fieldValue as Record<string, unknown>, schemaField.children, fieldPath, errors);
        }
      }
    }
  }
}