# Usage Examples

This file demonstrates how to use the mockingjar-lib package after installation.

## Installation

```bash
npm install mockingjar-lib
```

## Import the library

```javascript
// ES Modules (TypeScript/Modern Node.js)
import { Generator, Schema, Validation } from 'mockingjar-lib';

// CommonJS (Legacy Node.js)
const { Generator, Schema, Validation } = require('mockingjar-lib');
```

## Basic Usage

### Schema Creation and Data Generation

```javascript
// Define a schema
const userSchema = {
  name: 'User',
  description: 'User profile data',
  fields: [
    {
      id: 'field1',
      name: 'name',
      type: 'text',
      logic: { required: true, minLength: 2, maxLength: 50 }
    },
    {
      id: 'field2', 
      name: 'age',
      type: 'number',
      logic: { required: false, min: 18, max: 100 }
    },
    {
      id: 'field3',
      name: 'email',
      type: 'email',
      logic: { required: true }
    }
  ]
};

// Convert schema to preview JSON
const preview = Schema.convert.schemaToJson(userSchema.fields);
console.log(preview);
// Output: { name: 'text', age: 'number', email: 'email' }

// Generate actual mock data (requires Anthropic API key)
const anthropicKey = 'your-anthropic-api-key';
const prompt = 'Generate realistic user data for a social media platform';

Generator.generate(anthropicKey, userSchema, prompt, {
  count: 5,
  maxAttempts: 3,
  enableFallback: true,
  timeout: 60000
})
  .then(result => {
    if (result.success) {
      console.log('Generated data:', result.data);
      console.log('Generation metadata:', result.metadata);
    } else {
      console.error('Generation failed:', result.errors);
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

## Schema Manipulation

### Adding Fields

```javascript
let mySchema = {
  name: 'Product',
  fields: [
    {
      id: 'prod1',
      name: 'name',
      type: 'text',
      logic: { required: true }
    }
  ]
};

// Add a new field to the schema root
mySchema = Schema.add.field(mySchema);

// Add a field to an object (specify object field id)
mySchema = Schema.add.objectField('object-field-id', mySchema);

// Add a field to an array item object (specify array field id)
mySchema = Schema.add.arrayItemObjectField('array-field-id', mySchema);
```

### Updating Fields

```javascript
// Update field type
mySchema = Schema.update.fieldType(mySchema, 'prod1', 'email');

// Update array item field type
mySchema = Schema.update.arrayItemFieldType(mySchema, 'array-field-id', 'number');

// Update field with schema type
mySchema = Schema.update.fieldTypeSchema(mySchema, 'field-id', existingSchema);

// Update field properties
mySchema = Schema.update.field(mySchema, 'field-id', {
  name: 'updatedName',
  logic: { required: false, maxLength: 100 }
});
```

### Removing Fields

```javascript
// Remove a field by ID
mySchema = Schema.delete.field(mySchema, 'field-id');
```

### Schema Conversion

```javascript
// Convert schema to JSON preview
const jsonPreview = Schema.convert.schemaToJson(mySchema.fields, {
  collapsedFields: new Set(['field-to-collapse']),
  forPreview: true
});

// Convert JSON to schema
const existingData = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  address: {
    street: '123 Main St',
    city: 'New York'
  }
};

const convertedSchema = Schema.convert.jsonToSchema(existingData, 'User Schema');
console.log(convertedSchema);
```

## Data Validation

```javascript
const testData = {
  name: 'John Doe',
  age: 25,
  email: 'john@example.com'
};

// Validate data against schema
const validationErrors = Validation.validate(testData, userSchema);

if (validationErrors.length === 0) {
  console.log('Data is valid!');
} else {
  console.log('Validation errors found:');
  validationErrors.forEach(error => {
    console.log(`- ${error.affectedField}: ${error.reason}`);
  });
}
```

## Advanced Usage

### Complex Nested Schema

```javascript
const orderSchema = {
  name: 'Order',
  description: 'E-commerce order data',
  fields: [
    {
      id: 'order1',
      name: 'orderId',
      type: 'text',
      logic: { required: true, pattern: '^ORD-\\d{6}$' }
    },
    {
      id: 'order2',
      name: 'customer',
      type: 'object',
      children: [
        {
          id: 'cust1',
          name: 'name',
          type: 'text',
          logic: { required: true }
        },
        {
          id: 'cust2',
          name: 'email',
          type: 'email',
          logic: { required: true }
        }
      ]
    },
    {
      id: 'order3',
      name: 'items',
      type: 'array',
      logic: { minItems: 1, maxItems: 10 },
      arrayItemType: {
        id: 'item1',
        name: 'item',
        type: 'object',
        children: [
          {
            id: 'item1a',
            name: 'name',
            type: 'text',
            logic: { required: true }
          },
          {
            id: 'item1b',
            name: 'price',
            type: 'number',
            logic: { min: 0, required: true }
          },
          {
            id: 'item1c',
            name: 'quantity',
            type: 'number',
            logic: { min: 1, required: true }
          }
        ]
      }
    }
  ]
};

// Generate complex order data
Generator.generate(
  'your-anthropic-api-key',
  orderSchema,
  'Generate realistic e-commerce order data with various products',
  {
    count: 10,
    maxAttempts: 5,
    enableFallback: true,
    timeout: 120000
  }
)
  .then(result => {
    if (result.success) {
      console.log(`Generated ${result.data.length} orders`);
      console.log('Sample order:', result.data[0]);
      console.log('Generation stats:', result.metadata);
    }
  });
```

### Error Handling and Recovery

```javascript
// Generate with comprehensive error handling
async function generateWithErrorHandling() {
  try {
    const result = await Generator.generate(
      'your-anthropic-api-key',
      userSchema,
      'Generate test user data',
      {
        count: 20,
        maxAttempts: 3,
        enableFallback: true,
        timeout: 90000
      }
    );

    if (result.success) {
      // Validate all generated data
      const allValid = result.data.every(item => {
        const errors = Validation.validate(item, userSchema);
        return errors.length === 0;
      });

      console.log(`Generated ${result.data.length} items`);
      console.log(`All data valid: ${allValid}`);
      console.log('Generation metadata:', result.metadata);
      
      return result.data;
    } else {
      console.error('Generation failed:', result.errors);
      return [];
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return [];
  }
}

// Usage
generateWithErrorHandling().then(data => {
  console.log('Final data count:', data.length);
});
```

## TypeScript Usage

```typescript
import { Generator, Schema, Validation } from 'mockingjar-lib';
import type { JsonSchema, SchemaField, GenerationOptions, GenerationResult } from 'mockingjar-lib';

// Typed schema definition
const typedSchema: JsonSchema = {
  name: 'User',
  description: 'User profile data',
  fields: [
    {
      id: 'user1',
      name: 'name',
      type: 'text',
      logic: { required: true, minLength: 2, maxLength: 50 }
    },
    {
      id: 'user2',
      name: 'email',
      type: 'email',
      logic: { required: true }
    }
  ]
};

// Typed generation options
const options: GenerationOptions = {
  count: 10,
  maxAttempts: 3,
  enableFallback: true,
  timeout: 60000
};

// Typed generation function
async function generateTypedData(
  apiKey: string,
  schema: JsonSchema,
  prompt: string,
  opts: GenerationOptions
): Promise<any[]> {
  const result: GenerationResult = await Generator.generate(apiKey, schema, prompt, opts);
  
  if (result.success && result.data) {
    return result.data;
  }
  
  throw new Error(`Generation failed: ${result.errors?.join(', ')}`);
}
```

## Environment Configuration

```javascript
// Using environment variables
require('dotenv').config();

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

// Use in generation
Generator.generate(apiKey, schema, prompt, options);
```

## Best Practices

1. **Always validate generated data** against your schema
2. **Use descriptive prompts** for better AI generation quality
3. **Set appropriate timeouts** for large data generation
4. **Handle errors gracefully** with proper try-catch blocks
5. **Use TypeScript** for better type safety and IDE support
6. **Test with small counts first** before generating large datasets
7. **Store API keys securely** using environment variables
