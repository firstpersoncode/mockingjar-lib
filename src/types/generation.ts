import { JsonSchema } from './schema';

export interface GenerateDataParams {
  schema: JsonSchema;
  prompt: string;
  count: number;
}

export interface GenerationResultMetadata {
  totalFields: number;
  validFields: number;
  regeneratedFields: string[];
  generationTime: number;
}

export interface GenerationResult {
  success: boolean;
  data?: Record<string, unknown>[];
  errors?: string[];
  metadata?: GenerationResultMetadata;
}

export interface FieldGenerationContext {
  fieldPath: string;
  fieldType: string;
  parentContext?: Record<string, unknown>;
  siblingFields?: Record<string, unknown>;
  description?: string;
  constraints?: Record<string, unknown>;
}

export interface GenerationOptions {
  maxAttempts?: number;
  enableFallback?: boolean;
  timeout?: number;
  count?: number; // For batch generation
}
