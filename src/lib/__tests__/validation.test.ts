import { jsonValidator } from '../validation';
import { JsonSchema } from '@/types/schema';

describe('jsonValidator Complex Schema Tests', () => {
  describe('Multi-dimensional Array Validation', () => {
    it('should validate game board with nested arrays and constraints', () => {
      const schema: JsonSchema = {
        name: 'Game Board Schema',
        fields: [
          {
            id: '1',
            name: 'gameBoard',
            type: 'array',
            logic: { minItems: 3, maxItems: 3 },
            arrayItemType: {
              id: '1-1',
              name: 'row',
              type: 'array',
              logic: { minItems: 3, maxItems: 3 },
              arrayItemType: {
                id: '1-1-1',
                name: 'cell',
                type: 'object',
                children: [
                  {
                    id: '1-1-1-1',
                    name: 'value',
                    type: 'text',
                    logic: { required: true, enum: ['X', 'O', ''] }
                  },
                  {
                    id: '1-1-1-2',
                    name: 'position',
                    type: 'object',
                    children: [
                      {
                        id: '1-1-1-2-1',
                        name: 'x',
                        type: 'number',
                        logic: { required: true, min: 0, max: 2 }
                      },
                      {
                        id: '1-1-1-2-2',
                        name: 'y',
                        type: 'number',
                        logic: { required: true, min: 0, max: 2 }
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };

      const invalidData = {
        gameBoard: [
          [
            { value: 'X', position: { x: 0, y: 0 } },
            { value: 'O', position: { x: 1, y: 0 } },
            { value: 'INVALID', position: { x: 2, y: 0 } }
          ],
          [
            { value: 'X', position: { x: 0, y: 1 } },
            { value: 'O', position: { x: 5, y: 1 } },
            { value: 'X', position: { x: 2, y: -1 } }
          ]
        ]
      };

      const errors = jsonValidator(invalidData, schema);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.affectedField === 'gameBoard[0][2].value' && e.reason.includes('not allowed'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'gameBoard[1][1].position.x' && e.reason.includes('above maximum'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'gameBoard[1][2].position.y' && e.reason.includes('below minimum'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'gameBoard' && e.reason.includes('too short'))).toBe(true);
    });
  });

  describe('Deep Nested Object Validation', () => {
    it('should validate company structure with nested departments', () => {
      const schema: JsonSchema = {
        name: 'Company Schema',
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
                  logic: { required: true, minLength: 2 }
                },
                {
                  id: '1-1-2',
                  name: 'head',
                  type: 'object',
                  children: [
                    {
                      id: '1-1-2-1',
                      name: 'firstName',
                      type: 'text',
                      logic: { required: true, minLength: 2 }
                    },
                    {
                      id: '1-1-2-2',
                      name: 'email',
                      type: 'email',
                      logic: { required: true }
                    }
                  ]
                },
                {
                  id: '1-1-3',
                  name: 'employees',
                  type: 'array',
                  logic: { minItems: 1 },
                  arrayItemType: {
                    id: '1-1-3-1',
                    name: 'employee',
                    type: 'object',
                    children: [
                      {
                        id: '1-1-3-1-1',
                        name: 'id',
                        type: 'number',
                        logic: { required: true, min: 1 }
                      },
                      {
                        id: '1-1-3-1-2',
                        name: 'position',
                        type: 'text',
                        logic: { required: true, enum: ['junior', 'senior', 'lead'] }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      };

      const invalidData = {
        departments: [
          {
            name: 'A',
            head: {
              firstName: 'B',
              email: 'invalid-email'
            },
            employees: [
              {
                id: 0,
                position: 'invalid-position'
              }
            ]
          }
        ]
      };

      const errors = jsonValidator(invalidData, schema);
      expect(errors.length).toBeGreaterThan(3);
      expect(errors.some(e => e.affectedField === 'departments[0].name' && e.reason.includes('too short'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'departments[0].head.firstName' && e.reason.includes('too short'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'departments[0].head.email' && e.reason === 'malformed type')).toBe(true);
      expect(errors.some(e => e.affectedField === 'departments[0].employees[0].id' && e.reason.includes('below minimum'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'departments[0].employees[0].position' && e.reason.includes('not allowed'))).toBe(true);
    });
  });

  describe('E-commerce Order Validation', () => {
    it('should validate order with customer and items', () => {
      const schema: JsonSchema = {
        name: 'E-commerce Order Schema',
        fields: [
          {
            id: '1',
            name: 'orderId',
            type: 'text',
            logic: { required: true, minLength: 8 }
          },
          {
            id: '2',
            name: 'customer',
            type: 'object',
            children: [
              {
                id: '2-1',
                name: 'email',
                type: 'email',
                logic: { required: true }
              },
              {
                id: '2-2',
                name: 'tier',
                type: 'text',
                logic: { required: true, enum: ['bronze', 'silver', 'gold'] }
              }
            ]
          },
          {
            id: '3',
            name: 'items',
            type: 'array',
            logic: { minItems: 1 },
            arrayItemType: {
              id: '3-1',
              name: 'item',
              type: 'object',
              children: [
                {
                  id: '3-1-1',
                  name: 'productId',
                  type: 'text',
                  logic: { required: true, minLength: 6 }
                },
                {
                  id: '3-1-2',
                  name: 'quantity',
                  type: 'number',
                  logic: { required: true, min: 1, max: 99 }
                },
                {
                  id: '3-1-3',
                  name: 'category',
                  type: 'text',
                  logic: { required: true, enum: ['electronics', 'clothing', 'books'] }
                }
              ]
            }
          }
        ]
      };

      const invalidData = {
        orderId: 'SHORT',
        customer: {
          email: 'invalid-email',
          tier: 'platinum'
        },
        items: [
          {
            productId: 'ABC',
            quantity: 0,
            category: 'invalid-category'
          },
          {
            productId: 'DEF123456',
            quantity: 150,
            category: 'electronics'
          }
        ]
      };

      const errors = jsonValidator(invalidData, schema);
      expect(errors.length).toBeGreaterThan(5);
      expect(errors.some(e => e.affectedField === 'orderId' && e.reason.includes('too short'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'customer.email' && e.reason === 'malformed type')).toBe(true);
      expect(errors.some(e => e.affectedField === 'customer.tier' && e.reason.includes('not allowed'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'items[0].productId' && e.reason.includes('too short'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'items[0].quantity' && e.reason.includes('below minimum'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'items[0].category' && e.reason.includes('not allowed'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'items[1].quantity' && e.reason.includes('above maximum'))).toBe(true);
    });
  });

  describe('Missing Field Detection in Complex Structures', () => {
    it('should detect missing required fields in nested arrays and objects', () => {
      const schema: JsonSchema = {
        name: 'Blog Post Schema',
        fields: [
          {
            id: '1',
            name: 'author',
            type: 'object',
            children: [
              {
                id: '1-1',
                name: 'id',
                type: 'number',
                logic: { required: true }
              },
              {
                id: '1-2',
                name: 'username',
                type: 'text',
                logic: { required: true }
              }
            ]
          },
          {
            id: '2',
            name: 'comments',
            type: 'array',
            arrayItemType: {
              id: '2-1',
              name: 'comment',
              type: 'object',
              children: [
                {
                  id: '2-1-1',
                  name: 'authorName',
                  type: 'text',
                  logic: { required: true, minLength: 3 }
                },
                {
                  id: '2-1-2',
                  name: 'content',
                  type: 'text',
                  logic: { required: true, minLength: 10 }
                }
              ]
            }
          }
        ]
      };

      const incompleteData = {
        author: {},
        comments: [
          {
            authorName: 'AB',
            content: 'Short'
          },
          {}
        ]
      };

      const errors = jsonValidator(incompleteData, schema);
      expect(errors.length).toBeGreaterThan(4);
      expect(errors.some(e => e.affectedField === 'author.id' && e.reason === 'missing required field')).toBe(true);
      expect(errors.some(e => e.affectedField === 'author.username' && e.reason === 'missing required field')).toBe(true);
      expect(errors.some(e => e.affectedField === 'comments[0].authorName' && e.reason.includes('too short'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'comments[0].content' && e.reason.includes('too short'))).toBe(true);
      expect(errors.some(e => e.affectedField === 'comments[1].authorName' && e.reason === 'missing required field')).toBe(true);
      expect(errors.some(e => e.affectedField === 'comments[1].content' && e.reason === 'missing required field')).toBe(true);
    });
  });
});