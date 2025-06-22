const { Schema } = require('../dist/index.js');

describe('JSON to Schema Conversion', () => {
  describe('Schema.convert.jsonToSchema', () => {
    test('should convert simple primitive types', () => {
      const json = {
        name: 'John Doe',
        age: 30,
        isActive: true,
        score: null,
      };

      const result = Schema.convert.jsonToSchema(json, 'Test Schema');

      expect(result.name).toBe('Test Schema');
      expect(result.fields).toHaveLength(4);

      // Text field
      const nameField = result.fields.find(f => f.name === 'name');
      expect(nameField.type).toBe('text');
      expect(nameField.logic.maxLength).toBe(8);
      expect(nameField.logic.minLength).toBe(1);
      expect(nameField.logic.required).toBe(true);
      expect(nameField.id).toBeDefined();

      // Number field
      const ageField = result.fields.find(f => f.name === 'age');
      expect(ageField.type).toBe('number');
      expect(ageField.logic.min).toBeDefined();
      expect(ageField.logic.max).toBeDefined();
      expect(ageField.logic.required).toBe(true);
      expect(ageField.id).toBeDefined();

      // Boolean field
      const activeField = result.fields.find(f => f.name === 'isActive');
      expect(activeField.type).toBe('boolean');
      expect(activeField.logic.required).toBe(true);
      expect(activeField.id).toBeDefined();

      // Null field (defaults to text)
      const scoreField = result.fields.find(f => f.name === 'score');
      expect(scoreField.type).toBe('text');
      expect(scoreField.logic.required).toBe(false);
      expect(scoreField.id).toBeDefined();
    });

    test('should detect email, URL, and date patterns', () => {
      const json = {
        email: 'test@example.com',
        website: 'https://example.com',
        birthDate: '1990-12-25',
        joinDate: '2023-01-15T10:30:00Z',
        customDate: '12/25/1990',
      };

      const result = Schema.convert.jsonToSchema(json, 'Pattern Test');

      const emailField = result.fields.find(f => f.name === 'email');
      expect(emailField.type).toBe('email');
      expect(emailField.logic.maxLength).toBe(16);
      expect(emailField.id).toBeDefined();

      const websiteField = result.fields.find(f => f.name === 'website');
      expect(websiteField.type).toBe('url');
      expect(websiteField.logic.maxLength).toBe(19);
      expect(websiteField.id).toBeDefined();

      const birthDateField = result.fields.find(f => f.name === 'birthDate');
      expect(birthDateField.type).toBe('date');
      expect(birthDateField.id).toBeDefined();

      const joinDateField = result.fields.find(f => f.name === 'joinDate');
      expect(joinDateField.type).toBe('date');
      expect(joinDateField.id).toBeDefined();

      const customDateField = result.fields.find(f => f.name === 'customDate');
      expect(customDateField.type).toBe('date');
      expect(customDateField.id).toBeDefined();
    });

    test('should convert simple arrays', () => {
      const json = {
        tags: ['javascript', 'node', 'test'],
        scores: [85, 92, 78],
        flags: [true, false, true],
      };

      const result = Schema.convert.jsonToSchema(json, 'Array Test');

      const tagsField = result.fields.find(f => f.name === 'tags');
      expect(tagsField.type).toBe('array');
      expect(tagsField.logic.maxItems).toBe(3);
      expect(tagsField.logic.minItems).toBe(2);
      expect(tagsField.arrayItemType.type).toBe('text');
      expect(tagsField.id).toBeDefined();
      expect(tagsField.arrayItemType.id).toBeDefined();

      const scoresField = result.fields.find(f => f.name === 'scores');
      expect(scoresField.type).toBe('array');
      expect(scoresField.arrayItemType.type).toBe('number');
      expect(scoresField.id).toBeDefined();
      expect(scoresField.arrayItemType.id).toBeDefined();

      const flagsField = result.fields.find(f => f.name === 'flags');
      expect(flagsField.type).toBe('array');
      expect(flagsField.arrayItemType.type).toBe('boolean');
      expect(flagsField.id).toBeDefined();
      expect(flagsField.arrayItemType.id).toBeDefined();
    });

    test('should convert nested objects', () => {
      const json = {
        user: {
          profile: {
            name: 'John',
            age: 30,
          },
          settings: {
            notifications: true,
          },
        },
      };

      const result = Schema.convert.jsonToSchema(json, 'Nested Test');

      const userField = result.fields.find(f => f.name === 'user');
      expect(userField.type).toBe('object');
      expect(userField.children).toHaveLength(2);
      expect(userField.id).toBeDefined();

      const profileField = userField.children.find(f => f.name === 'profile');
      expect(profileField.type).toBe('object');
      expect(profileField.children).toHaveLength(2);
      expect(profileField.id).toBeDefined();

      const nameField = profileField.children.find(f => f.name === 'name');
      expect(nameField.type).toBe('text');
      expect(nameField.logic.maxLength).toBe(4);
      expect(nameField.id).toBeDefined();

      const ageField = profileField.children.find(f => f.name === 'age');
      expect(ageField.type).toBe('number');
      expect(ageField.id).toBeDefined();

      const settingsField = userField.children.find(f => f.name === 'settings');
      expect(settingsField.type).toBe('object');
      expect(settingsField.children).toHaveLength(1);
      expect(settingsField.id).toBeDefined();

      const notificationsField = settingsField.children.find(f => f.name === 'notifications');
      expect(notificationsField.type).toBe('boolean');
      expect(notificationsField.id).toBeDefined();
    });

    test('should convert arrays of objects', () => {
      const json = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      };

      const result = Schema.convert.jsonToSchema(json, 'Array Objects Test');

      const usersField = result.fields.find(f => f.name === 'users');
      expect(usersField.type).toBe('array');
      expect(usersField.logic.maxItems).toBe(2);
      expect(usersField.arrayItemType.type).toBe('object');
      expect(usersField.arrayItemType.children).toHaveLength(2);
      expect(usersField.id).toBeDefined();
      expect(usersField.arrayItemType.id).toBeDefined();

      const nameField = usersField.arrayItemType.children.find(f => f.name === 'name');
      expect(nameField.type).toBe('text');
      expect(nameField.id).toBeDefined();

      const ageField = usersField.arrayItemType.children.find(f => f.name === 'age');
      expect(ageField.type).toBe('number');
      expect(ageField.id).toBeDefined();
    });

    test('should handle arrays of objects with different fields', () => {
      const json = {
        items: [
          { name: 'Item 1', price: 10.99 },
          { name: 'Item 2', category: 'electronics', inStock: true },
          { description: 'Item 3 desc', price: 25.50 },
        ],
      };

      const result = Schema.convert.jsonToSchema(json, 'Mixed Objects Test');

      const itemsField = result.fields.find(f => f.name === 'items');
      expect(itemsField.type).toBe('array');
      expect(itemsField.arrayItemType.type).toBe('object');
      expect(itemsField.arrayItemType.children).toHaveLength(5);
      expect(itemsField.id).toBeDefined();
      expect(itemsField.arrayItemType.id).toBeDefined();

      const fields = itemsField.arrayItemType.children;
      expect(fields.find(f => f.name === 'name')).toBeDefined();
      expect(fields.find(f => f.name === 'price')).toBeDefined();
      expect(fields.find(f => f.name === 'category')).toBeDefined();
      expect(fields.find(f => f.name === 'inStock')).toBeDefined();
      expect(fields.find(f => f.name === 'description')).toBeDefined();

      fields.forEach(field => {
        expect(field.id).toBeDefined();
      });
    });

    test('should handle deeply nested arrays', () => {
      const json = {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      };

      const result = Schema.convert.jsonToSchema(json, 'Nested Array Test');

      const matrixField = result.fields.find(f => f.name === 'matrix');
      expect(matrixField.type).toBe('array');
      expect(matrixField.arrayItemType.type).toBe('array');
      expect(matrixField.arrayItemType.arrayItemType.type).toBe('number');
      expect(matrixField.id).toBeDefined();
      expect(matrixField.arrayItemType.id).toBeDefined();
      expect(matrixField.arrayItemType.arrayItemType.id).toBeDefined();
    });

    test('should handle complex nested structures', () => {
      const json = {
        company: {
          name: 'Tech Corp',
          departments: [
            {
              name: 'Engineering',
              employees: [
                { name: 'John', skills: ['javascript', 'python'] },
                { name: 'Jane', skills: ['java', 'go'] },
              ],
            },
          ],
        },
      };

      const result = Schema.convert.jsonToSchema(json, 'Complex Test');

      const companyField = result.fields.find(f => f.name === 'company');
      expect(companyField.type).toBe('object');
      expect(companyField.id).toBeDefined();

      const departmentsField = companyField.children.find(f => f.name === 'departments');
      expect(departmentsField.type).toBe('array');
      expect(departmentsField.arrayItemType.type).toBe('object');
      expect(departmentsField.id).toBeDefined();
      expect(departmentsField.arrayItemType.id).toBeDefined();

      const employeesField = departmentsField.arrayItemType.children.find(f => f.name === 'employees');
      expect(employeesField.type).toBe('array');
      expect(employeesField.arrayItemType.type).toBe('object');
      expect(employeesField.id).toBeDefined();
      expect(employeesField.arrayItemType.id).toBeDefined();

      const skillsField = employeesField.arrayItemType.children.find(f => f.name === 'skills');
      expect(skillsField.type).toBe('array');
      expect(skillsField.arrayItemType.type).toBe('text');
      expect(skillsField.id).toBeDefined();
      expect(skillsField.arrayItemType.id).toBeDefined();
    });

    test('should handle empty arrays', () => {
      const json = {
        emptyArray: [],
      };

      const result = Schema.convert.jsonToSchema(json, 'Empty Array Test');

      const emptyField = result.fields.find(f => f.name === 'emptyArray');
      expect(emptyField.type).toBe('array');
      expect(emptyField.logic.maxItems).toBe(0);
      expect(emptyField.arrayItemType.type).toBe('text');
      expect(emptyField.id).toBeDefined();
      expect(emptyField.arrayItemType.id).toBeDefined();
    });

    test('should use default schema name when not provided', () => {
      const json = { field: 'value' };
      const result = Schema.convert.jsonToSchema(json);
      expect(result.name).toBe('Converted Schema');
    });

    test('should handle empty objects', () => {
      const json = {};
      const result = Schema.convert.jsonToSchema(json, 'Empty Test');
      expect(result.name).toBe('Empty Test');
      expect(result.fields).toHaveLength(0);
    });

    test('should throw error for root-level arrays', () => {
      const jsonArray = [
        { name: 'Item 1', value: 1 },
        { name: 'Item 2', value: 2 }
      ];

      expect(() => {
        Schema.convert.jsonToSchema(jsonArray, 'Invalid Array');
      }).toThrow('JSON cannot start with an array as the root element. Array fields are allowed within objects, but the root must be an object.');
    });

    test('should throw error for null input', () => {
      expect(() => {
        Schema.convert.jsonToSchema(null, 'Null Test');
      }).toThrow('JSON cannot be null or undefined.');
    });

    test('should throw error for undefined input', () => {
      expect(() => {
        Schema.convert.jsonToSchema(undefined, 'Undefined Test');
      }).toThrow('JSON cannot be null or undefined.');
    });

    test('should throw error for primitive inputs', () => {
      expect(() => {
        Schema.convert.jsonToSchema('string', 'String Test');
      }).toThrow('JSON must be an object. Primitive values are not allowed as the root element.');

      expect(() => {
        Schema.convert.jsonToSchema(123, 'Number Test');
      }).toThrow('JSON must be an object. Primitive values are not allowed as the root element.');

      expect(() => {
        Schema.convert.jsonToSchema(true, 'Boolean Test');
      }).toThrow('JSON must be an object. Primitive values are not allowed as the root element.');
    });
  });
});
