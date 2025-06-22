const { Validation } = require('../dist/index.js');

describe('Validation Unit Tests', () => {
  describe('Validation.validate - Basic Type Validation', () => {
    test('should validate text fields correctly', () => {
      const schema = {
        name: 'Text Schema',
        fields: [
          {
            id: '1',
            name: 'username',
            type: 'text',
            logic: { required: true, minLength: 3, maxLength: 20 }
          }
        ]
      };

      // Valid data
      const validData = { username: 'johndoe' };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - missing required field
      const missingData = {};
      const missingErrors = Validation.validate(missingData, schema);
      expect(missingErrors).toHaveLength(1);
      expect(missingErrors[0].reason).toBe('missing required field');
      expect(missingErrors[0].affectedField).toBe('username');

      // Invalid - wrong type
      const wrongTypeData = { username: 123 };
      const wrongTypeErrors = Validation.validate(wrongTypeData, schema);
      expect(wrongTypeErrors).toHaveLength(1);
      expect(wrongTypeErrors[0].reason).toBe('malformed type');

      // Invalid - too short
      const tooShortData = { username: 'ab' };
      const tooShortErrors = Validation.validate(tooShortData, schema);
      expect(tooShortErrors).toHaveLength(1);
      expect(tooShortErrors[0].reason).toContain('too short');

      // Invalid - too long
      const tooLongData = { username: 'a'.repeat(25) };
      const tooLongErrors = Validation.validate(tooLongData, schema);
      expect(tooLongErrors).toHaveLength(1);
      expect(tooLongErrors[0].reason).toContain('too long');
    });

    test('should validate number fields correctly', () => {
      const schema = {
        name: 'Number Schema',
        fields: [
          {
            id: '1',
            name: 'age',
            type: 'number',
            logic: { required: true, min: 0, max: 120 }
          }
        ]
      };

      // Valid data
      const validData = { age: 25 };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - wrong type
      const wrongTypeData = { age: '25' };
      const wrongTypeErrors = Validation.validate(wrongTypeData, schema);
      expect(wrongTypeErrors).toHaveLength(1);
      expect(wrongTypeErrors[0].reason).toBe('malformed type');

      // Invalid - below minimum
      const belowMinData = { age: -5 };
      const belowMinErrors = Validation.validate(belowMinData, schema);
      expect(belowMinErrors).toHaveLength(1);
      expect(belowMinErrors[0].reason).toContain('below minimum');

      // Invalid - above maximum
      const aboveMaxData = { age: 150 };
      const aboveMaxErrors = Validation.validate(aboveMaxData, schema);
      expect(aboveMaxErrors).toHaveLength(1);
      expect(aboveMaxErrors[0].reason).toContain('above maximum');
    });

    test('should validate boolean fields correctly', () => {
      const schema = {
        name: 'Boolean Schema',
        fields: [
          {
            id: '1',
            name: 'isActive',
            type: 'boolean',
            logic: { required: true }
          }
        ]
      };

      // Valid data
      const validData = { isActive: true };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - wrong type
      const wrongTypeData = { isActive: 'true' };
      const wrongTypeErrors = Validation.validate(wrongTypeData, schema);
      expect(wrongTypeErrors).toHaveLength(1);
      expect(wrongTypeErrors[0].reason).toBe('malformed type');
    });

    test('should validate email fields correctly', () => {
      const schema = {
        name: 'Email Schema',
        fields: [
          {
            id: '1',
            name: 'email',
            type: 'email',
            logic: { required: true }
          }
        ]
      };

      // Valid data
      const validData = { email: 'user@example.com' };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - no @ symbol
      const invalidEmailData = { email: 'userexample.com' };
      const invalidEmailErrors = Validation.validate(invalidEmailData, schema);
      expect(invalidEmailErrors).toHaveLength(1);
      expect(invalidEmailErrors[0].reason).toBe('malformed type');
    });
  });

  describe('Validation.validate - Enum Validation', () => {
    test('should validate text enum fields correctly', () => {
      const schema = {
        name: 'Text Enum Schema',
        fields: [
          {
            id: '1',
            name: 'status',
            type: 'text',
            logic: { required: true, enum: ['ACTIVE', 'INACTIVE', 'PENDING'] }
          }
        ]
      };

      // Valid data
      const validData = { status: 'ACTIVE' };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - not in enum
      const invalidData = { status: 'UNKNOWN' };
      const invalidErrors = Validation.validate(invalidData, schema);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].reason).toContain('not allowed');
    });

    test('should validate number enum fields correctly', () => {
      const schema = {
        name: 'Number Enum Schema',
        fields: [
          {
            id: '1',
            name: 'rating',
            type: 'number',
            logic: { required: true, min: 1, max: 5 }
          }
        ]
      };

      // Valid data
      const validData = { rating: 4 };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - above max
      const invalidData = { rating: 7 };
      const invalidErrors = Validation.validate(invalidData, schema);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].reason).toContain('above maximum');
    });
  });

  describe('Validation.validate - Object Validation', () => {
    test('should validate nested object fields correctly', () => {
      const schema = {
        name: 'Object Schema',
        fields: [
          {
            id: '1',
            name: 'user',
            type: 'object',
            children: [
              {
                id: '1-1',
                name: 'name',
                type: 'text',
                logic: { required: true, minLength: 2 }
              },
              {
                id: '1-2',
                name: 'age',
                type: 'number',
                logic: { required: false, min: 0 }
              }
            ]
          }
        ]
      };

      // Valid data
      const validData = {
        user: {
          name: 'John Doe',
          age: 30
        }
      };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - missing required nested field
      const missingNestedData = {
        user: {
          age: 30
        }
      };
      const missingNestedErrors = Validation.validate(missingNestedData, schema);
      expect(missingNestedErrors).toHaveLength(1);
      expect(missingNestedErrors[0].affectedField).toBe('user.name');
      expect(missingNestedErrors[0].reason).toBe('missing required field');

      // Invalid - nested field validation error
      const invalidNestedData = {
        user: {
          name: 'J',
          age: -5
        }
      };
      const invalidNestedErrors = Validation.validate(invalidNestedData, schema);
      expect(invalidNestedErrors).toHaveLength(2);
      expect(invalidNestedErrors.some(e => e.affectedField === 'user.name' && e.reason.includes('too short'))).toBe(true);
      expect(invalidNestedErrors.some(e => e.affectedField === 'user.age' && e.reason.includes('below minimum'))).toBe(true);
    });

    test('should validate deeply nested objects correctly', () => {
      const schema = {
        name: 'Deep Object Schema',
        fields: [
          {
            id: '1',
            name: 'company',
            type: 'object',
            children: [
              {
                id: '1-1',
                name: 'address',
                type: 'object',
                children: [
                  {
                    id: '1-1-1',
                    name: 'street',
                    type: 'text',
                    logic: { required: true }
                  },
                  {
                    id: '1-1-2',
                    name: 'coordinates',
                    type: 'object',
                    children: [
                      {
                        id: '1-1-2-1',
                        name: 'lat',
                        type: 'number',
                        logic: { required: true, min: -90, max: 90 }
                      },
                      {
                        id: '1-1-2-2',
                        name: 'lng',
                        type: 'number',
                        logic: { required: true, min: -180, max: 180 }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      // Valid data
      const validData = {
        company: {
          address: {
            street: '123 Main St',
            coordinates: {
              lat: 40.7128,
              lng: -74.0060
            }
          }
        }
      };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - deeply nested validation error
      const invalidData = {
        company: {
          address: {
            street: '123 Main St',
            coordinates: {
              lat: 95,  // Invalid latitude
              lng: -200  // Invalid longitude
            }
          }
        }
      };
      const invalidErrors = Validation.validate(invalidData, schema);
      expect(invalidErrors).toHaveLength(2);
      expect(invalidErrors.some(e => e.affectedField === 'company.address.coordinates.lat')).toBe(true);
      expect(invalidErrors.some(e => e.affectedField === 'company.address.coordinates.lng')).toBe(true);
    });
  });

  describe('Validation.validate - Array Validation', () => {
    test('should validate simple array fields correctly', () => {
      const schema = {
        name: 'Array Schema',
        fields: [
          {
            id: '1',
            name: 'tags',
            type: 'array',
            logic: { minItems: 2, maxItems: 5 },
            arrayItemType: {
              id: '1-1',
              name: 'tag',
              type: 'text',
              logic: { required: true, minLength: 2 }
            }
          }
        ]
      };

      // Valid data
      const validData = {
        tags: ['javascript', 'nodejs', 'react']
      };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - wrong type (not array)
      const wrongTypeData = { tags: 'javascript,nodejs' };
      const wrongTypeErrors = Validation.validate(wrongTypeData, schema);
      expect(wrongTypeErrors).toHaveLength(1);
      expect(wrongTypeErrors[0].reason).toBe('malformed type');

      // Invalid - too few items
      const tooFewData = { tags: ['javascript'] };
      const tooFewErrors = Validation.validate(tooFewData, schema);
      expect(tooFewErrors).toHaveLength(1);
      expect(tooFewErrors[0].reason).toContain('too short');

      // Invalid - too many items
      const tooManyData = { tags: ['js', 'node', 'react', 'vue', 'angular', 'svelte'] };
      const tooManyErrors = Validation.validate(tooManyData, schema);
      expect(tooManyErrors).toHaveLength(1);
      expect(tooManyErrors[0].reason).toContain('too long');

      // Invalid - array item validation error
      const invalidItemData = { tags: ['javascript', 'a', 'react'] };
      const invalidItemErrors = Validation.validate(invalidItemData, schema);
      expect(invalidItemErrors).toHaveLength(2); // Item error + array malformed error
      expect(invalidItemErrors.some(e => e.affectedField === 'tags[1]' && e.reason.includes('too short'))).toBe(true);
      expect(invalidItemErrors.some(e => e.affectedField === 'tags' && e.reason === 'malformed type')).toBe(true);
    });

    test('should validate array of objects correctly', () => {
      const schema = {
        name: 'Array of Objects Schema',
        fields: [
          {
            id: '1',
            name: 'users',
            type: 'array',
            logic: { minItems: 1 },
            arrayItemType: {
              id: '1-1',
              name: 'user',
              type: 'object',
              children: [
                {
                  id: '1-1-1',
                  name: 'name',
                  type: 'text',
                  logic: { required: true, minLength: 2 }
                },
                {
                  id: '1-1-2',
                  name: 'email',
                  type: 'email',
                  logic: { required: true }
                }
              ]
            }
          }
        ]
      };

      // Valid data
      const validData = {
        users: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' }
        ]
      };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - object in array missing required field
      const missingFieldData = {
        users: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith' }  // Missing email
        ]
      };
      const missingFieldErrors = Validation.validate(missingFieldData, schema);
      expect(missingFieldErrors).toHaveLength(2); // Missing field error + array malformed error
      expect(missingFieldErrors.some(e => e.affectedField === 'users[1].email' && e.reason === 'missing required field')).toBe(true);
      expect(missingFieldErrors.some(e => e.affectedField === 'users' && e.reason === 'malformed type')).toBe(true);

      // Invalid - object in array field validation error
      const invalidFieldData = {
        users: [
          { name: 'J', email: 'invalidemailformat' }
        ]
      };
      const invalidFieldErrors = Validation.validate(invalidFieldData, schema);
      expect(invalidFieldErrors).toHaveLength(3); // Field errors + array malformed error
      expect(invalidFieldErrors.some(e => e.affectedField === 'users[0].name')).toBe(true);
      expect(invalidFieldErrors.some(e => e.affectedField === 'users[0].email')).toBe(true);
    });

    test('should validate multi-dimensional arrays correctly', () => {
      const schema = {
        name: 'Multi-dimensional Array Schema',
        fields: [
          {
            id: '1',
            name: 'matrix',
            type: 'array',
            logic: { minItems: 2 },
            arrayItemType: {
              id: '1-1',
              name: 'row',
              type: 'array',
              logic: { minItems: 2 },
              arrayItemType: {
                id: '1-1-1',
                name: 'cell',
                type: 'number',
                logic: { required: true, min: 0, max: 100 }
              }
            }
          }
        ]
      };

      // Valid data
      const validData = {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]
      };
      const validErrors = Validation.validate(validData, schema);
      expect(validErrors).toHaveLength(0);

      // Invalid - nested array validation error
      const invalidData = {
        matrix: [
          [1, 2, 3],
          [150]  // Value exceeds max, and array too short
        ]
      };
      const invalidErrors = Validation.validate(invalidData, schema);
      expect(invalidErrors).toHaveLength(4); // Item errors + nested array malformed errors
      expect(invalidErrors.some(e => e.affectedField === 'matrix[1][0]' && e.reason.includes('above maximum'))).toBe(true);
      expect(invalidErrors.some(e => e.affectedField === 'matrix[1]' && e.reason.includes('too short'))).toBe(true);
    });
  });

  describe('Validation.validate - Edge Cases and Error Handling', () => {
    test('should handle empty schema gracefully', () => {
      const emptySchema = { name: 'Empty Schema', fields: [] };
      const data = { someField: 'value' };
      
      const errors = Validation.validate(data, emptySchema);
      expect(errors).toHaveLength(1); // Unidentified field error
      expect(errors[0].reason).toBe('Unidentified field');
    });

    test('should handle empty data object gracefully', () => {
      const schema = {
        name: 'Simple Schema',
        fields: [
          {
            id: '1',
            name: 'optionalField',
            type: 'text',
            logic: { required: false }
          }
        ]
      };
      
      const errors = Validation.validate({}, schema);
      expect(errors).toHaveLength(0);
    });

    test('should handle null and undefined values correctly', () => {
      const schema = {
        name: 'Null Test Schema',
        fields: [
          {
            id: '1',
            name: 'nullableField',
            type: 'text',
            logic: { required: false }
          },
          {
            id: '2',
            name: 'requiredField',
            type: 'text',
            logic: { required: true }
          }
        ]
      };

      // Null values for optional fields are treated as malformed type
      const nullData = { nullableField: null, requiredField: 'value' };
      const nullErrors = Validation.validate(nullData, schema);
      expect(nullErrors).toHaveLength(1); // Null treated as malformed type
      expect(nullErrors[0].reason).toBe('malformed type');

      // Null values for required fields should be invalid
      const nullRequiredData = { nullableField: 'value', requiredField: null };
      const nullRequiredErrors = Validation.validate(nullRequiredData, schema);
      expect(nullRequiredErrors).toHaveLength(1);
      expect(nullRequiredErrors[0].affectedField).toBe('requiredField');
    });

    test('should detect unidentified fields in data', () => {
      const schema = {
        name: 'Strict Schema',
        fields: [
          {
            id: '1',
            name: 'allowedField',
            type: 'text',
            logic: { required: true }
          }
        ]
      };

      const dataWithExtraFields = {
        allowedField: 'value',
        extraField1: 'unexpected',
        extraField2: 123
      };

      const errors = Validation.validate(dataWithExtraFields, schema);
      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(errors.some(e => e.affectedField === 'extraField1' && e.reason === 'Unidentified field')).toBe(true);
      expect(errors.some(e => e.affectedField === 'extraField2' && e.reason === 'Unidentified field')).toBe(true);
    });

    test('should validate complex nested structures without performance issues', () => {
      const complexSchema = {
        name: 'Complex Schema',
        fields: [
          {
            id: '1',
            name: 'departments',
            type: 'array',
            logic: { minItems: 1 },
            arrayItemType: {
              id: '1-1',
              name: 'department',
              type: 'object',
              children: [
                {
                  id: '1-1-1',
                  name: 'name',
                  type: 'text',
                  logic: { required: true }
                },
                {
                  id: '1-1-2',
                  name: 'employees',
                  type: 'array',
                  arrayItemType: {
                    id: '1-1-2-1',
                    name: 'employee',
                    type: 'object',
                    children: [
                      {
                        id: '1-1-2-1-1',
                        name: 'name',
                        type: 'text',
                        logic: { required: true }
                      },
                      {
                        id: '1-1-2-1-2',
                        name: 'skills',
                        type: 'array',
                        arrayItemType: {
                          id: '1-1-2-1-2-1',
                          name: 'skill',
                          type: 'text',
                          logic: { required: true, minLength: 2 }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      };

      const complexData = {
        departments: [
          {
            name: 'Engineering',
            employees: [
              {
                name: 'Alice',
                skills: ['JavaScript', 'React', 'Node.js']
              },
              {
                name: 'Bob',
                skills: ['Python', 'Django']
              }
            ]
          },
          {
            name: 'Marketing',
            employees: [
              {
                name: 'Carol',
                skills: ['SEO', 'Analytics']
              }
            ]
          }
        ]
      };

      const startTime = Date.now();
      const errors = Validation.validate(complexData, complexSchema);
      const endTime = Date.now();

      expect(errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Validation.validate - Pattern Validation', () => {
    test('should validate text pattern constraints correctly', () => {
      const schema = {
        name: 'Pattern Schema',
        fields: [
          {
            id: '1',
            name: 'phoneNumber',
            type: 'text',
            logic: { required: true, pattern: '^\\+?[1-9]\\d{1,14}$' }
          }
        ]
      };

      // Valid phone numbers
      const validData1 = { phoneNumber: '+1234567890' };
      const validErrors1 = Validation.validate(validData1, schema);
      expect(validErrors1).toHaveLength(0);

      const validData2 = { phoneNumber: '1234567890' };
      const validErrors2 = Validation.validate(validData2, schema);
      expect(validErrors2).toHaveLength(0);

      // Invalid phone number
      const invalidData = { phoneNumber: 'not-a-phone' };
      const invalidErrors = Validation.validate(invalidData, schema);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].reason).toBe('pattern mismatch');
    });
  });
});
