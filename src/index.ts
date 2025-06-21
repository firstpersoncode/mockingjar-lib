require('dotenv').config();

import { createAnthropicClient } from './lib/anthropic';
import { generateJsonData as _generateJsonData } from './lib/generator';
import { GenerationOptions, GenerationResult } from './types/generation';
import { JsonSchema } from './types/schema';
import {
  convertSchemaToJson as _convertSchemaToJson,
  addField,
  addObjectField,
  addArrayItemObjectField,
  updateFieldType,
  updateArrayItemFieldType,
  deleteField,
  GenerateSchemaPreviewOptions,
} from './lib/schema';

export const generateJsonData = async (
  anthropicKey: string,
  schema: JsonSchema,
  prompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  const anthropic = createAnthropicClient(anthropicKey);

  if (!anthropic) {
    throw new Error(
      'Anthropic client could not be created. Please check your API key.'
    );
  }

  return _generateJsonData(anthropic, schema, prompt, options);
};

export const convertSchemaToJson = (
  schema: JsonSchema,
  options: GenerateSchemaPreviewOptions = {}
): Record<string, unknown> => {
  return _convertSchemaToJson(schema.fields, options);
};

export const add = {
  field: addField,
  objectField: addObjectField,
  arrayItemObjectField: addArrayItemObjectField,
};

export const update = {
  fieldType: updateFieldType,
  arrayItemFieldType: updateArrayItemFieldType,
};

export const remove = {
  field: deleteField,
};
