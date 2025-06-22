# MockingJar Library - JSON Data Generator

**A TypeScript library for AI-powered JSON schema creation and test data generation.**

1. **[Overview](#overview)**
2. **[Installation](#installation)**
3. **[Usage](#usage)**
4. **[Development](#development)**
5. **[Technology Stack](#technology-stack)**
6. **[Project Structure](#project-structure)**
7. **[Core Features](#core-features)**
8. **[Testing](#testing)**
9. **[Contributing](#contributing)**
10. **[MIT License](#mit-license)**
11. **[Support](#support)**

---

## Overview

MockingJar Library is a TypeScript library that provides JSON schema creation and AI-powered data generation capabilities. Built with modern TypeScript, comprehensive testing, and integrated with Anthropic Claude AI, it enables developers to create complex JSON structures and generate realistic data through natural language prompts.

This library serves as the core engine for JSON schema manipulation, data generation, and validation, designed to be integrated into web applications, CLI tools, or other TypeScript/Node.js projects.

---

## Installation

```bash
npm install mockingjar-lib
```

---

## Usage

### Basic Usage

```typescript
import { Generator, Schema, Validation } from 'mockingjar-lib';

// Define a schema
const userSchema = {
  name: 'User',
  description: 'User profile data',
  fields: [
    {
      id: '1',
      name: 'name',
      type: 'text',
      logic: { required: true, minLength: 2, maxLength: 50 }
    },
    {
      id: '2',
      name: 'email',
      type: 'email',
      logic: { required: true }
    },
    {
      id: '3',
      name: 'age',
      type: 'number',
      logic: { min: 18, max: 100 }
    }
  ]
};

// Generate data using the Generator module
const result = await Generator.generate(
  'your-anthropic-api-key',
  userSchema,
  'Generate realistic user data for a social media platform',
  {
    count: 5,
    maxAttempts: 3,
    enableFallback: true,
    timeout: 60000
  }
);

if (result.success) {
  console.log('Generated data:', result.data);
  console.log('Metadata:', result.metadata);
} else {
  console.error('Generation failed:', result.errors);
}
```

### Schema Manipulation

```typescript
import { Schema } from 'mockingjar-lib';

let mySchema = {
  name: 'User',
  fields: [
    {
      id: 'user-1',
      name: 'name',
      type: 'text',
      logic: { required: true }
    }
  ]
};

// Add a new field to the schema root
mySchema = Schema.add.field(mySchema);

// Add a field to an object (requires object field id)
mySchema = Schema.add.objectField('object-field-id', mySchema);

// Add a field to an array item object (requires array field id)
mySchema = Schema.add.arrayItemObjectField('array-field-id', mySchema);

// Update field type (requires field id and new type)
mySchema = Schema.update.fieldType(mySchema, 'field-id', 'email');

// Update array item field type (requires field id and new type)
mySchema = Schema.update.arrayItemFieldType(mySchema, 'array-field-id', 'number');

// Remove a field (requires field id)
mySchema = Schema.delete.field(mySchema, 'field-id');

// Convert schema to JSON preview
const jsonPreview = Schema.convert.schemaToJson(mySchema.fields, {
  collapsedFields: new Set(['field-id-to-collapse']),
  forPreview: true
});

// Convert JSON to schema
const convertedSchema = Schema.convert.jsonToSchema(
  { name: 'John', age: 30, email: 'john@example.com' },
  'User Schema'
);
```

### Data Validation

```typescript
import { Validation } from 'mockingjar-lib';

const data = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

const errors = Validation.validate(data, userSchema);

if (errors.length === 0) {
  console.log('Data is valid!');
} else {
  console.log('Validation errors:', errors);
  // Each error contains: parent, affectedField, reason, structure
}
```

### Advanced Usage with Complex Schema

```typescript
import { Generator } from 'mockingjar-lib';

// Complex nested schema
const orderSchema = {
  name: 'Order',
  description: 'E-commerce order data',
  fields: [
    {
      id: '1',
      name: 'orderId',
      type: 'text',
      logic: { required: true, pattern: '^ORD-\\d{6}$' }
    },
    {
      id: '2',
      name: 'customer',
      type: 'object',
      children: [
        { id: '2a', name: 'name', type: 'text', logic: { required: true } },
        { id: '2b', name: 'email', type: 'email', logic: { required: true } }
      ]
    },
    {
      id: '3',
      name: 'items',
      type: 'array',
      logic: { minItems: 1, maxItems: 10 },
      arrayItemType: {
        id: '3-item',
        name: 'item',
        type: 'object',
        children: [
          { id: '3a', name: 'name', type: 'text' },
          { id: '3b', name: 'price', type: 'number', logic: { min: 0 } },
          { id: '3c', name: 'quantity', type: 'number', logic: { min: 1 } }
        ]
      }
    }
  ]
};

// Generate order data with error recovery
const result = await Generator.generate(
  'your-anthropic-api-key',
  orderSchema,
  'Generate realistic e-commerce order data with various products',
  {
    count: 10,
    maxAttempts: 5,
    enableFallback: true,
    timeout: 120000
  }
);

console.log('Orders generated:', result.data?.length);
console.log('Generation metadata:', result.metadata);
```

---

## Development

### Prerequisites
- Node.js 16+ 
- npm package manager
- Anthropic API key for AI features

### Installation

```bash
# Clone the repository
git clone https://github.com/firstpersoncode/mockingjar-lib
cd mockingjar-lib

# Install dependencies
npm install
```

### Available Scripts

```bash
# Development
npm run dev              # Watch mode compilation
npm run build           # Production build with minification
npm run build:clean     # Clean build from scratch
npm run build:no-minify # Build without minification
npm run start           # Run compiled code

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode testing
npm run test:coverage   # Test coverage report
npm run test:ci         # CI-friendly test run

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix auto-fixable lint issues
npm run lint:check      # Strict linting with zero warnings

# Type Checking
npm run compile         # Type check without output
npm run compile:check   # Fast type check with skip lib check
```

### Development Workflow

1. **Make changes** to source files in `src/`
2. **Run tests** with `npm run test:watch`
3. **Check types** with `npm run compile:check`
4. **Lint code** with `npm run lint:fix`
5. **Build** with `npm run build:clean`

---

## Technology Stack

### Runtime & Language
- **Runtime**: Node.js 16+
- **Language**: TypeScript with strict mode
- **Main Dependencies**: 
  - Anthropic Claude SDK for AI integration
  - Lodash for utility functions
  - UUID for unique identifiers

### Development Tools
- **Testing**: Jest with TypeScript support (ts-jest)
- **Linting**: ESLint with TypeScript parser and strict rules
- **Type Checking**: TypeScript compiler with strict configuration
- **Build System**: TypeScript compiler with minification
- **Package Manager**: npm with lockfile for dependency consistency

### Architecture Highlights
- **Type Safety**: Full TypeScript implementation with strict mode enabled
- **Modular Design**: Clean separation of concerns with focused modules
- **Comprehensive Testing**: 146 unit tests with 88% coverage for critical functionality
- **AI Integration**: Seamless integration with Anthropic Claude for intelligent data generation

---

## Project Structure

```
mockingjar-lib/
├── src/                              # Source code
│   ├── index.ts                      # Main entry point with module exports
│   ├── lib/                          # Core business logic
│   └── types/                        # TypeScript type definitions
├── __tests__/                        # Comprehensive test suite
├── dist/                             # Compiled JavaScript output
├── coverage/                         # Test coverage reports
├── scripts/                          # Build and utility scripts
└── README.md                         # Project documentation
```

### Key Directories

#### `/src/lib/` - Core Business Logic
The heart of the library containing all essential functionality:

- **generator.ts**: Advanced data generation engine with AI integration and error recovery
- **validation.ts**: Comprehensive JSON validation system with detailed error reporting
- **schema.ts**: Schema manipulation, conversion, and field management utilities
- **anthropic.ts**: AI integration layer with Anthropic Claude API for intelligent data generation
- **_debugger.ts**: Development tools for debugging generation processes

#### `/src/types/` - TypeScript Definitions
Complete type system for the library:

- **schema.ts**: Schema field and structure type definitions with comprehensive field types
- **generation.ts**: Generation process, results, and progress tracking types

#### `/__tests__/` - Comprehensive Test Suite
146 unit tests covering all critical functionality:

- **generator.test.js**: Tests for data generation, AI integration, and error recovery
- **schema.test.js**: Tests for schema manipulation and CRUD operations
- **validation.test.js**: Tests for schema validation and error reporting
- **json-to-schema-conversion.test.js**: Tests for JSON-to-schema conversion
- **deep-nested-deletion.test.js**: Tests for deep nested structure deletion
- **deep-array-item-deletion.test.js**: Tests for complex array manipulation

#### Core Library Features
- **Field Management**: Add, update, and remove fields with deep nesting support
- **Schema Validation**: Comprehensive type checking and constraint validation  
- **Error Recovery**: Surgical regeneration of failed fields during generation
- **AI Integration**: Natural language prompts for contextual data generation
- **Type Safety**: Full TypeScript support with strict typing

---

## Core Features

1. **[JSON Schema Management](#json-schema-management)**: Create and manipulate complex JSON schemas
2. **[AI-Powered Data Generation](#ai-powered-data-generation)**: Generate realistic test data using natural language
3. **[Validation System](#validation-system)**: Comprehensive JSON validation with detailed error reporting
4. **[Error Recovery](#error-recovery)**: Advanced error handling and surgical data regeneration

### JSON Schema Management

The library provides comprehensive tools for creating and managing JSON schemas through the `Schema` module:

#### Schema Field Types
Support for all essential data types with full constraint configuration:
- **text**: String values with optional length constraints and patterns
- **number**: Numeric values with min/max range validation
- **boolean**: True/false values
- **date**: Date/time values in various formats
- **email**: Email address validation with proper format checking
- **url**: URL format validation
- **array**: Arrays with configurable item types and size constraints
- **object**: Nested objects with child field definitions
- **schema**: References to existing schemas for composition and reuse

#### Schema Structure
```typescript
interface SchemaField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'array' | 'object' | 'schema';
  logic?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
    minItems?: number;
    maxItems?: number;
  };
  children?: SchemaField[]; // For object type
  arrayItemType?: SchemaField; // For array type
  description?: string;
}
```

### AI-Powered Data Generation

Advanced data generation with AI integration and error recovery through the `Generator` module:

#### Generation Process
1. **Schema Analysis**: Parse and understand the schema structure
2. **AI Prompt Creation**: Generate context-aware prompts for Anthropic Claude
3. **Data Generation**: Create realistic data based on schema constraints
4. **Validation**: Comprehensive validation against schema rules
5. **Error Recovery**: Surgical regeneration of invalid fields only

#### Generation Features
- **Natural Language Prompts**: Use descriptive prompts for contextual data
- **Schema Compliance**: Strict adherence to defined structure and constraints
- **Selective Error Handling**: Fix specific problems without affecting valid data
- **Progress Tracking**: Real-time generation progress feedback
- **Metadata**: Detailed generation statistics and performance metrics

### Validation System

Comprehensive JSON validation engine through the `Validation` module:
- **Type & Constraint Validation**: Strict checking for all field types, lengths, ranges, patterns
- **Structure Validation**: Nested object and array structure verification  
- **Field Detection**: Identification of missing required fields and extra unidentified fields
- **Array Validation**: Item-level validation with error tracking

```typescript
interface ValidationError {
  parent: string | null;
  affectedField: string;
  reason: string;
  structure: SchemaField | null;
}
```

#### Validation Features
- **Type Checking**: Validate data types against schema definitions
- **Constraint Validation**: Check length, range, pattern, and enum constraints
- **Nested Object Support**: Deep validation of complex nested structures
- **Array Validation**: Item type and size constraint checking
- **Detailed Error Messages**: Specific, actionable error information

### Error Recovery

Advanced error handling with surgical regeneration:

#### Recovery Process
1. **Error Detection**: Identify specific validation failures
2. **Context Preservation**: Keep all valid data intact
3. **Targeted Regeneration**: Fix only the problematic fields
4. **Validation Loop**: Continue until all data is valid or max attempts reached

---

## Testing

The project includes a comprehensive test suite covering all critical functionality with 146 tests and 88% code coverage:

### Test Structure
```
__tests__/
├── generator.test.js                 # Data generation tests
├── schema.test.js                    # Schema manipulation tests
├── validation.test.js                # Schema validation and error handling tests
├── json-to-schema-conversion.test.js # JSON conversion tests
├── deep-nested-deletion.test.js      # Deep structure tests
└── deep-array-item-deletion.test.js  # Array manipulation tests
```

### Test Coverage
- **Schema Validation**: Comprehensive validation logic testing
- **Schema Manipulation**: Complete CRUD operations testing
- **Data Generation**: AI integration and generation process testing
- **Error Recovery**: Surgical regeneration and error handling
- **Type Safety**: TypeScript type checking and constraint validation
- **Edge Cases**: Deep nesting, complex arrays, and boundary conditions

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI-friendly test run
npm run test:ci
```

---

## Contributing

**MockingJar Library thrives on community collaboration!** We welcome contributions from developers of all experience levels.

### 🌟 Ways to Contribute

- 🐛 **Report Bugs** - Found an issue? Help us fix it!
- 💡 **Suggest Features** - Share your ideas for improvements
- 📝 **Improve Documentation** - Help others understand the library better
- 🔧 **Submit Code** - Fix bugs, add features, or optimize performance
- 🧪 **Write Tests** - Help us maintain reliability and quality
- 🎨 **Optimize Performance** - Improve generation speed and memory usage

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/firstpersoncode/mockingjar-lib
   cd mockingjar-lib
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Add your Anthropic API key
   ```

4. **Run Tests**
   ```bash
   npm run test:watch
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

### Code Quality Standards

- **TypeScript**: Strict mode enabled with comprehensive typing
- **ESLint**: Configured with TypeScript parser and strict rules
- **Testing**: Unit tests required for new features (maintain 88%+ coverage)
- **Documentation**: JSDoc comments for public APIs
- **Commit Messages**: Conventional commit format preferred

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following existing patterns
   - Add/update tests as needed
   - Update documentation if required

3. **Quality Checks**
   ```bash
   npm run lint:fix
   npm run test:coverage
   npm run compile:check
   ```

4. **Submit PR**
   - Clear description of changes
   - Link to related issues
   - Include test results

### 💬 Community Guidelines

- **Be respectful** and inclusive in all interactions
- **Ask questions** - no question is too basic
- **Share knowledge** - help others learn and grow
- **Stay curious** - explore, experiment, and innovate

**Ready to contribute?** Open an issue, submit a pull request, or simply star the project to show your support!

*Together, we're building the future of JSON data generation.*

---

## MIT License

Copyright (c) 2025 MockingJar Library

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Support

For technical support, feature requests, or bug reports, please contact the development team or create an issue in the project repository.

---

*MockingJar Library - Powering intelligent JSON schema creation and data generation.*
