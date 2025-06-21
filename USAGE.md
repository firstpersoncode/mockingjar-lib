# Usage Examples

This file demonstrates how to use the mockingjar-lib package after installation.

## Installation

```bash
npm install mockingjar-lib
```

## Import the library

```javascript
// CommonJS
const { generateJsonData, convertSchemaToJson, add, update, remove } = require('mockingjar-lib');

// ES Modules (if using TypeScript or modern Node.js)
import { generateJsonData, convertSchemaToJson, add, update, remove } from 'mockingjar-lib';
```

## Basic Usage

```javascript
// Define a schema
const schema = {
  fields: [
    {
      id: 'field1',
      name: 'name',
      type: 'string',
      required: true
    },
    {
      id: 'field2', 
      name: 'age',
      type: 'number',
      required: false
    }
  ]
};

// Convert schema to preview JSON
const preview = convertSchemaToJson(schema);
console.log(preview);
// Output: { name: 'unknown', age: 'number' }

// Generate actual mock data (requires Anthropic API key)
const anthropicKey = 'your-anthropic-api-key';
const prompt = 'Generate realistic user data';

generateJsonData(anthropicKey, schema, prompt)
  .then(result => {
    console.log('Generated data:', result.data);
    console.log('Success:', result.success);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

## Schema Manipulation

```javascript
// Add a new field
const updatedSchema = add.field(schema);

// Add an object field to a specific target
const schemaWithObject = add.objectField('field1', schema);

// Update field type
const modifiedSchema = update.fieldType('field2', 'string', schema);

// Remove a field
const reducedSchema = remove.field('field2', schema);
```
