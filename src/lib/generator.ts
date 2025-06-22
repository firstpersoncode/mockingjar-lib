import type Anthropic from '@anthropic-ai/sdk';
import { JsonSchema, SchemaField } from '@/types/schema';
import { GenerationResult, GenerationOptions } from '@/types/generation';
import { jsonValidator, ValidationError } from './validation';
import { convertSchemaToJson } from './schema';
// import { logDebugData, resetDebugSession } from './_debugger';
import { merge, cloneDeep, unset, pick } from 'lodash';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs';

/**
 * Remove unidentified fields that don't exist in the schema
 */
function removeUnidentifiedFields(
  data: Record<string, unknown>,
  unidentifiedFields: ValidationError[]
): Record<string, unknown> {
  // Deep clone the data to avoid modifying the original
  const clone = cloneDeep(data);
  const fieldsToRemove = unidentifiedFields.map((error) => error.affectedField);

  // Remove unidentified fields
  for (const field of fieldsToRemove) {
    unset(clone, field);
  }

  return clone;
}

/**
 * Generate a partial schema containing only the error fields
 * Properly reconstructs nested field hierarchies
 */
function generatePartialSchema(
  originalSchema: JsonSchema,
  errorFields: string[]
): JsonSchema {
  if (errorFields.length === 0) {
    return originalSchema;
  }

  const originalFields = originalSchema.fields || [];
  const partialFields: SchemaField[] = [];
  const fieldMap = new Map<string, SchemaField>();

  // Build surgical partial schema by only including invalid field paths
  for (const errorField of errorFields) {
    const pathParts = errorField.split('.');

    // Build the minimal required field structure for this error path
    const requiredField = buildMinimalFieldStructure(originalFields, pathParts);
    if (requiredField) {
      mergeIntoPartialFields(partialFields, fieldMap, requiredField);
    }
  }

  return {
    ...originalSchema,
    fields: partialFields,
  };
}

/**
 * Build minimal field structure needed to represent a specific error path
 * Only includes the exact path to the invalid field, not siblings
 */
function buildMinimalFieldStructure(
  originalFields: SchemaField[],
  pathParts: string[]
): SchemaField | null {
  if (pathParts.length === 0) return null;

  const [currentPart, ...remainingParts] = pathParts;

  // Handle array indices like "tags[0]" by extracting the field name
  const fieldName = currentPart.replace(/\[\d+\]$/, '');

  // Find the field in the current level
  const originalField = originalFields.find(
    (field) => field.name === fieldName
  );
  if (!originalField) return null;

  // If this is the final part of the path, return a deep clone
  if (remainingParts.length === 0) {
    return cloneDeep(originalField);
  }

  // For nested paths, recursively build the structure
  if (originalField.type === 'object' && originalField.children) {
    const nestedField = buildMinimalFieldStructure(
      originalField.children,
      remainingParts
    );
    if (nestedField) {
      return {
        ...pick(originalField, ['id', 'name', 'type', 'logic']),
        children: [nestedField], // Only include the invalid child, not all siblings
      };
    }
  }

  // For arrays, include the array structure but only invalid nested parts
  if (originalField.type === 'array' && originalField.arrayItemType) {
    // For array items, we need to include the complete arrayItemType structure
    // because we can't partially define array item schemas
    return cloneDeep(originalField);
  }

  return cloneDeep(originalField);
}

/**
 * Merge a required field into the partial fields array
 * Handles merging of nested structures without duplication
 */
function mergeIntoPartialFields(
  partialFields: SchemaField[],
  fieldMap: Map<string, SchemaField>,
  newField: SchemaField
): void {
  const existingField = fieldMap.get(newField.name);

  if (!existingField) {
    // Field doesn't exist, add it
    partialFields.push(newField);
    fieldMap.set(newField.name, newField);
  } else {
    // Field exists, merge the children if it's an object
    if (
      newField.type === 'object' &&
      newField.children &&
      existingField.children
    ) {
      const mergedChildren = [...existingField.children];
      const childMap = new Map(
        existingField.children.map((child) => [child.name, child])
      );

      for (const newChild of newField.children) {
        if (!childMap.has(newChild.name)) {
          mergedChildren.push(newChild);
          childMap.set(newChild.name, newChild);
        }
      }

      existingField.children = mergedChildren;
    }
  }
}

/**
 * Extract only valid fields from data for AI context
 * Only includes fields that pass validation to provide good examples
 */
function extractValidContext(
  data: Record<string, unknown>,
  validationErrors: ValidationError[]
): Record<string, unknown> {
  // Deep clone the data to avoid modifying the original
  const clone = cloneDeep(data);
  const fieldsToRemove = validationErrors.map((error) => error.affectedField);

  // Remove unidentified fields
  for (const field of fieldsToRemove) {
    unset(clone, field);
  }

  return clone;
}

/**
 * Remove markdown formatting from Claude's response
 */
function stripMarkdown(text: string): string {
  // Remove code blocks (```json...``` or ```...```)
  let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');

  // If no code blocks found, try to extract JSON object/array
  if (cleaned === text) {
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      cleaned = jsonMatch[1];
    }
  }

  return cleaned.trim();
}

/**
 * Generate a prompt for Claude API
 */
function createMessages(
  currentResults: Record<string, unknown>[],
  userPrompt: string,
  outputSchema: Record<string, unknown>,
  clonedContext?: Record<string, unknown>
): MessageParam[] {
  const messages: MessageParam[] = [
    {
      role: 'assistant',
      content: 'Hello, I am structured data assistant. My task is to generate valid JSON values based on user\'s prompt. I will respond only with valid JSON, no markdown or explanations.',
    },
  ];

  if (currentResults.length > 0) {
    const lastResult = currentResults[currentResults.length - 1];
    messages.push({
      role: 'user',
      content: `Here is the previously generated data example:
          ${JSON.stringify(lastResult, null, 2)}

          Please do not make an exact copy of this data, but use it as a reference to generate new data that follows the same structure, rules and relevance.`,
    });
  }

  if (clonedContext && Object.keys(clonedContext).length > 0) {
    messages.push({
      role: 'assistant',
      content: `I have the following context to work with, and will make sure the generated data is related and relevant to this:
            ${JSON.stringify(clonedContext, null, 2)}
          `,
    });
  }

  messages.push({
    role: 'assistant',
    content: `
        I will generate data based on the following JSON structure and its rules.

        OUTPUT STRUCTURE TO BE STRICTLY FOLLOWED:
        ${JSON.stringify(outputSchema, null, 2)}

        RULES:
        1. Follow each field's type and structure exactly.
        2. Follow each field's name and type as specified in the output structure.
        3. Follow each field's constraints and requirements defined.

        As I said, I will respond only with valid JSON, no markdown or explanations.
      `,
  });

  messages.push({
    role: 'user',
    content: `
        Generate a JSON object that relevant to this prompt:
        "${userPrompt}"
      `,
  });

  return messages;
}

/**
 * Simplify field names by removing array indices for regenerated fields tracking
 */
function simplifyFieldName(fieldPath: string): string {
  // Remove array indices like [0], [1], etc. and replace with generic names
  // "office.tags[0][0].item" -> "office.tags.item"
  // "office.tags[1]" -> "office.tags"
  return fieldPath.replace(/\[\d+\]/g, '');
}

/**
 * Main hybrid data generation function
 */
export async function generateJsonData(
  anthropic: Anthropic,
  schema: JsonSchema,
  prompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const { maxAttempts = 5, timeout = 30000, count = 1 } = options;

  const regeneratedFields: string[] = [];
  const startTime = Date.now();

  const results: Record<string, unknown>[] = [];

  async function generate(
    currentSchema: JsonSchema,
    validContext: Record<string, unknown> | null = null,
    totalAttempts: number = 0
  ): Promise<void> {
    // Check recursion depth limit before incrementing
    if (totalAttempts >= maxAttempts) {
      throw new Error(
        `Maximum recursion depth (${maxAttempts}) exceeded. Unable to fix validation errors after ${totalAttempts} attempts.`
      );
    }

    // Increment attempts counter for this function call
    totalAttempts++;
    // logDebugData('currentSchema.json', currentSchema);

    const clonedContext = validContext ? cloneDeep(validContext) : null;

    // logDebugData('validContext.json', clonedContext);

    const convertedSchema = convertSchemaToJson(currentSchema);

    // logDebugData('convertedSchema.json', convertedSchema);

    // Single API call - no retry loop
    const apiCall = anthropic.messages.create({
      model: 'claude-4-sonnet-20250514',
      max_tokens: 4096,
      temperature: 0.1,
      messages: createMessages(
        results,
        prompt,
        convertedSchema,
        clonedContext || undefined
      ),
    });

    // Apply timeout if specified
    const response = (await (timeout
      ? Promise.race([
          apiCall,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          ),
        ])
      : apiCall)) as { content?: Array<{ type: string; text: string }> };

      if (!response.content?.[0]) {
        console.log('ERROR');
      }

    const content = response.content?.[0];
    if (!content || content.type !== 'text') {
      throw new Error('Claude response did not include valid text content');
    }

    // Strip markdown and parse JSON
    const cleanedText = stripMarkdown(content.text);
    let jsonResult: Record<string, unknown>;

    try {
      jsonResult = JSON.parse(cleanedText);
    } catch {
      throw new Error('Invalid JSON response from Claude');
    }

    // logDebugData('jsonResult.json', jsonResult);

    const validationErrors = jsonValidator(jsonResult, currentSchema);
    // logDebugData('validationErrors.json', validationErrors);
    const unidentifiedFields = validationErrors.filter(
      (error) => error.reason === 'Unidentified field'
    );
    // logDebugData('unidentifiedFields.json', unidentifiedFields);
    const otherErrors = validationErrors.filter(
      (error) => error.reason !== 'Unidentified field'
    );
    // logDebugData('otherErrors.json', otherErrors);

    const errorFields: string[] = [];

    // Track which fields needed regeneration
    for (const error of otherErrors) {
      if (error.structure) {
        const simplifiedField = simplifyFieldName(error.affectedField);

        if (!errorFields.includes(simplifiedField)) {
          errorFields.push(simplifiedField);
        }

        if (!regeneratedFields.includes(simplifiedField)) {
          regeneratedFields.push(simplifiedField);
        }
      }
    }

    // logDebugData('errorFields.json', errorFields);
    // logDebugData('regeneratedFields.json', regeneratedFields);

    // const fixedFields = regeneratedFields.filter((field) => {
    //   return !errorFields.includes(field);
    // });

    // logDebugData('fixedFields.json', fixedFields);

    if (unidentifiedFields.length > 0) {
      jsonResult = removeUnidentifiedFields(jsonResult, unidentifiedFields);
      // logDebugData('jsonResult.cleaned.json', jsonResult);
    }

    if (otherErrors.length === 0) {
      const result = merge(clonedContext, jsonResult);
      // logDebugData('validContext.json', result);
      results.push(result);
      return;
    }

    const extractedValidContext = extractValidContext(jsonResult, otherErrors);
    // logDebugData('extractedValidContext.json', extractedValidContext);
    // Recursively fix the errors
    return generate(
      generatePartialSchema(currentSchema, errorFields),
      merge(clonedContext, extractedValidContext),
      totalAttempts
    );
  }

  try {
    // Start the generation process

    for (let i = 0; i < count; i++) {
      await generate(schema);
    }

    const generationTime = Date.now() - startTime;

    const result = {
      success: true,
      data: results,
      metadata: {
        totalFields: schema.fields.length,
        validFields: schema.fields.length,
        regeneratedFields,
        generationTime,
      },
    };

    // logDebugData('generationResult.json', result);

    // resetDebugSession(); // Reset debug session for next run

    return result;
  } catch (error) {
    console.log(
      'GENERATOR ERROR:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    const result = {
      success: false,
      errors: [
        error instanceof Error
          ? `Generation failed: ${error.message}`
          : 'Generation failed: Unknown error occurred',
      ],
      metadata: {
        totalFields: schema.fields.length,
        validFields: 0,
        regeneratedFields,
        generationTime: Date.now() - startTime,
      },
    };

    // logDebugData('generationError.json', result);

    // resetDebugSession(); // Reset debug session for next run

    return result;
  }
}
