require('dotenv').config();

import { createAnthropicClient } from './lib/anthropic';
import { generateJsonData as _generateJsonData } from './lib/generator';
import { GenerationOptions, GenerationResult } from './types/generation';
import { JsonSchema } from './types/schema';
import {
  convertSchemaToJson,
  addField,
  addObjectField,
  addArrayItemObjectField,
  updateFieldType,
  updateArrayItemFieldType,
  deleteField,
  handleSchemaSelected,
  updateField,
  convertJsonToSchema,
} from './lib/schema';
import { jsonValidator } from './lib/validation';

const generateJsonData = async (
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

export const Generator = {
  generate: generateJsonData,
  _generate: _generateJsonData,
};

export const Schema = {
  add: {
    field: addField,
    objectField: addObjectField,
    arrayItemObjectField: addArrayItemObjectField,
  },
  update: {
    field: updateField,
    fieldType: updateFieldType,
    arrayItemFieldType: updateArrayItemFieldType,
    fieldTypeSchema: handleSchemaSelected,
  },
  delete: {
    field: deleteField,
  },
  convert: {
    schemaToJson: convertSchemaToJson,
    jsonToSchema: convertJsonToSchema
  },
};

export const Validation = {
  validate: jsonValidator,
};
