const { Schema } = require('../dist/index');

describe('Deep Nested Array Item OBJECT Deletion Tests', () => {
  describe('Array Item Object Deletion at Various Nesting Levels', () => {
    test('Level 1: Delete array item object directly', () => {
      const level1Schema = {
        id: 'level1-test',
        name: 'Level 1 Array Item Object Deletion',
        fields: [
          {
            id: 'root-array',
            name: 'root-array',
            type: 'array',
            logic: { required: false },
            arrayItemType: {
              id: 'target-object',
              name: 'target-object',
              type: 'object',
              logic: { required: false },
              children: [
                {
                  id: 'child-field1',
                  name: 'child-field1',
                  type: 'text',
                  logic: { required: false }
                },
                {
                  id: 'child-field2',
                  name: 'child-field2',
                  type: 'number',
                  logic: { required: false }
                }
              ]
            }
          }
        ]
      };

      console.log('=== LEVEL 1: BEFORE ARRAY ITEM OBJECT DELETION ===');
      console.log('Root array has arrayItemType:', !!level1Schema.fields[0].arrayItemType);
      console.log('ArrayItemType ID:', level1Schema.fields[0].arrayItemType?.id);

      const result = Schema.delete.field('target-object', level1Schema);

      console.log('=== LEVEL 1: AFTER ARRAY ITEM OBJECT DELETION ===');
      console.log('Root array has arrayItemType:', !!result.fields[0].arrayItemType);
      console.log('ArrayItemType should be replaced with text field');

      // Verify the entire array item object is replaced with text field
      expect(result.fields[0].arrayItemType).toBeDefined();
      expect(result.fields[0].arrayItemType.type).toBe('text');
      expect(result.fields[0].arrayItemType.name).toBe('target-object');
      
      // Verify root array field still exists
      expect(result.fields).toHaveLength(1);
      expect(result.fields[0].id).toBe('root-array');
      expect(result.fields[0].type).toBe('array');
    });

    test('Level 2: Delete array item object within another array item object', () => {
      const level2Schema = {
        id: 'level2-test',
        name: 'Level 2 Array Item Object Deletion',
        fields: [
          {
            id: 'root-array',
            name: 'root-array',
            type: 'array',
            logic: { required: false },
            arrayItemType: {
              id: 'level1-object',
              name: 'level1-object',
              type: 'object',
              logic: { required: false },
              children: [
                {
                  id: 'level1-field',
                  name: 'level1-field',
                  type: 'text',
                  logic: { required: false }
                },
                {
                  id: 'nested-array',
                  name: 'nested-array',
                  type: 'array',
                  logic: { required: false },
                  arrayItemType: {
                    id: 'target-level2-object',
                    name: 'target-level2-object',
                    type: 'object',
                    logic: { required: false },
                    children: [
                      {
                        id: 'level2-field1',
                        name: 'level2-field1',
                        type: 'text',
                        logic: { required: false }
                      },
                      {
                        id: 'level2-field2',
                        name: 'level2-field2',
                        type: 'boolean',
                        logic: { required: false }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      };

      console.log('=== LEVEL 2: BEFORE ARRAY ITEM OBJECT DELETION ===');
      const nestedArrayBefore = level2Schema.fields[0].arrayItemType.children[1];
      console.log('Nested array has arrayItemType:', !!nestedArrayBefore.arrayItemType);
      console.log('Nested arrayItemType ID:', nestedArrayBefore.arrayItemType?.id);

      const result = Schema.delete.field('target-level2-object', level2Schema);

      console.log('=== LEVEL 2: AFTER ARRAY ITEM OBJECT DELETION ===');
      const nestedArrayAfter = result.fields[0].arrayItemType.children[1];
      console.log('Nested array has arrayItemType:', !!nestedArrayAfter.arrayItemType);

      // Verify the level 2 array item object is replaced with text field
      expect(nestedArrayAfter.arrayItemType).toBeDefined();
      expect(nestedArrayAfter.arrayItemType.type).toBe('text');
      expect(nestedArrayAfter.arrayItemType.name).toBe('target-level2-object');
      
      // Verify level 1 structure remains intact
      expect(result.fields[0].arrayItemType.children).toHaveLength(2);
      expect(result.fields[0].arrayItemType.children[0].id).toBe('level1-field');
      expect(result.fields[0].arrayItemType.children[1].id).toBe('nested-array');
    });

    test('Level 3: Three levels deep array item object deletion', () => {
      const level3Schema = {
        id: 'level3-test',
        name: 'Level 3 Array Item Object Deletion',
        fields: [
          {
            id: 'root-array',
            name: 'root-array',
            type: 'array',
            logic: { required: false },
            arrayItemType: {
              id: 'level1-object',
              name: 'level1-object',
              type: 'object',
              logic: { required: false },
              children: [
                {
                  id: 'level2-array',
                  name: 'level2-array',
                  type: 'array',
                  logic: { required: false },
                  arrayItemType: {
                    id: 'level2-object',
                    name: 'level2-object',
                    type: 'object',
                    logic: { required: false },
                    children: [
                      {
                        id: 'level3-array',
                        name: 'level3-array',
                        type: 'array',
                        logic: { required: false },
                        arrayItemType: {
                          id: 'target-level3-object',
                          name: 'target-level3-object',
                          type: 'object',
                          logic: { required: false },
                          children: [
                            {
                              id: 'deep-field1',
                              name: 'deep-field1',
                              type: 'text',
                              logic: { required: false }
                            },
                            {
                              id: 'deep-field2',
                              name: 'deep-field2',
                              type: 'email',
                              logic: { required: false }
                            }
                          ]
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

      console.log('=== LEVEL 3: BEFORE ARRAY ITEM OBJECT DELETION ===');
      const level3ArrayBefore = level3Schema.fields[0].arrayItemType.children[0].arrayItemType.children[0];
      console.log('Level 3 array has arrayItemType:', !!level3ArrayBefore.arrayItemType);
      console.log('Level 3 arrayItemType ID:', level3ArrayBefore.arrayItemType?.id);

      const result = Schema.delete.field('target-level3-object', level3Schema);

      console.log('=== LEVEL 3: AFTER ARRAY ITEM OBJECT DELETION ===');
      const level3ArrayAfter = result.fields[0].arrayItemType.children[0].arrayItemType.children[0];
      console.log('Level 3 array has arrayItemType:', !!level3ArrayAfter.arrayItemType);

      // Verify the level 3 array item object is replaced with text field
      expect(level3ArrayAfter.arrayItemType).toBeDefined();
      expect(level3ArrayAfter.arrayItemType.type).toBe('text');
      expect(level3ArrayAfter.arrayItemType.name).toBe('target-level3-object');
      
      // Verify all parent structures remain intact
      expect(result.fields[0].arrayItemType.children[0].arrayItemType.children).toHaveLength(1);
      expect(result.fields[0].arrayItemType.children[0].arrayItemType.children[0].id).toBe('level3-array');
    });

    test('Level 5: Five levels deep array item object deletion', () => {
      const level5Schema = {
        id: 'level5-test',
        name: 'Level 5 Array Item Object Deletion',
        fields: [
          {
            id: 'root-array',
            name: 'root-array',
            type: 'array',
            logic: { required: false },
            arrayItemType: {
              id: 'level1-object',
              name: 'level1-object',
              type: 'object',
              logic: { required: false },
              children: [
                {
                  id: 'level2-array',
                  name: 'level2-array',
                  type: 'array',
                  logic: { required: false },
                  arrayItemType: {
                    id: 'level2-object',
                    name: 'level2-object', 
                    type: 'object',
                    logic: { required: false },
                    children: [
                      {
                        id: 'level3-array',
                        name: 'level3-array',
                        type: 'array',
                        logic: { required: false },
                        arrayItemType: {
                          id: 'level3-object',
                          name: 'level3-object',
                          type: 'object',
                          logic: { required: false },
                          children: [
                            {
                              id: 'level4-array',
                              name: 'level4-array',
                              type: 'array',
                              logic: { required: false },
                              arrayItemType: {
                                id: 'level4-object',
                                name: 'level4-object',
                                type: 'object',
                                logic: { required: false },
                                children: [
                                  {
                                    id: 'level5-array',
                                    name: 'level5-array',
                                    type: 'array',
                                    logic: { required: false },
                                    arrayItemType: {
                                      id: 'target-level5-object',
                                      name: 'target-level5-object',
                                      type: 'object',
                                      logic: { required: false },
                                      children: [
                                        {
                                          id: 'deep5-field1',
                                          name: 'deep5-field1',
                                          type: 'text',
                                          logic: { required: false }
                                        },
                                        {
                                          id: 'deep5-field2',
                                          name: 'deep5-field2',
                                          type: 'url',
                                          logic: { required: false }
                                        }
                                      ]
                                    }
                                  }
                                ]
                              }
                            }
                          ]
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

      console.log('=== LEVEL 5: BEFORE ARRAY ITEM OBJECT DELETION ===');
      const level5ArrayBefore = level5Schema.fields[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children[0];
      console.log('Level 5 array has arrayItemType:', !!level5ArrayBefore.arrayItemType);
      console.log('Level 5 arrayItemType ID:', level5ArrayBefore.arrayItemType?.id);

      const result = Schema.delete.field('target-level5-object', level5Schema);

      console.log('=== LEVEL 5: AFTER ARRAY ITEM OBJECT DELETION ===');
      const level5ArrayAfter = result.fields[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children[0];
      console.log('Level 5 array has arrayItemType:', !!level5ArrayAfter.arrayItemType);

      // Verify the level 5 array item object is replaced with text field
      expect(level5ArrayAfter.arrayItemType).toBeDefined();
      expect(level5ArrayAfter.arrayItemType.type).toBe('text');
      expect(level5ArrayAfter.arrayItemType.name).toBe('target-level5-object');
      
      // Verify all parent structures remain intact
      expect(result.fields[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children).toHaveLength(1);
      expect(result.fields[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children[0].arrayItemType.children[0].id).toBe('level5-array');
    });

    test('Mixed Structure: Array→Object→Array→Object deletion', () => {
      const mixedSchema = {
        id: 'mixed-test',
        name: 'Mixed Structure Array Item Object Deletion',
        fields: [
          {
            id: 'root-array',
            name: 'root-array',
            type: 'array',
            logic: { required: false },
            arrayItemType: {
              id: 'level1-object',
              name: 'level1-object',
              type: 'object',
              logic: { required: false },
              children: [
                {
                  id: 'level1-field',
                  name: 'level1-field',
                  type: 'text',
                  logic: { required: false }
                },
                {
                  id: 'inner-array',
                  name: 'inner-array',
                  type: 'array',
                  logic: { required: false },
                  arrayItemType: {
                    id: 'target-inner-object',
                    name: 'target-inner-object',
                    type: 'object',
                    logic: { required: false },
                    children: [
                      {
                        id: 'inner-field1',
                        name: 'inner-field1',
                        type: 'text',
                        logic: { required: false }
                      },
                      {
                        id: 'inner-field2',
                        name: 'inner-field2',
                        type: 'boolean',
                        logic: { required: false }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      };

      console.log('=== MIXED: BEFORE ARRAY ITEM OBJECT DELETION ===');
      const innerArrayBefore = mixedSchema.fields[0].arrayItemType.children[1];
      console.log('Inner array has arrayItemType:', !!innerArrayBefore.arrayItemType);
      console.log('Inner arrayItemType ID:', innerArrayBefore.arrayItemType?.id);

      const result = Schema.delete.field('target-inner-object', mixedSchema);

      console.log('=== MIXED: AFTER ARRAY ITEM OBJECT DELETION ===');
      const innerArrayAfter = result.fields[0].arrayItemType.children[1];
      console.log('Inner array has arrayItemType:', !!innerArrayAfter.arrayItemType);

      // Verify the inner array item object is replaced with text field
      expect(innerArrayAfter.arrayItemType).toBeDefined();
      expect(innerArrayAfter.arrayItemType.type).toBe('text');
      expect(innerArrayAfter.arrayItemType.name).toBe('target-inner-object');
      
      // Verify structure remains intact
      expect(result.fields[0].arrayItemType.children).toHaveLength(2);
      expect(result.fields[0].arrayItemType.children[0].id).toBe('level1-field');
      expect(result.fields[0].arrayItemType.children[1].id).toBe('inner-array');
    });

    test('Sibling Scenario: Delete one array item object among multiple siblings', () => {
      const siblingSchema = {
        id: 'sibling-test',
        name: 'Sibling Array Item Object Deletion',
        fields: [
          {
            id: 'root-object',
            name: 'root-object',
            type: 'object',
            logic: { required: false },
            children: [
              {
                id: 'array1',
                name: 'array1',
                type: 'array',
                logic: { required: false },
                arrayItemType: {
                  id: 'target-object1',
                  name: 'target-object1',
                  type: 'object',
                  logic: { required: false },
                  children: [
                    {
                      id: 'obj1-field',
                      name: 'obj1-field',
                      type: 'text',
                      logic: { required: false }
                    }
                  ]
                }
              },
              {
                id: 'array2',
                name: 'array2',
                type: 'array',
                logic: { required: false },
                arrayItemType: {
                  id: 'sibling-object2',
                  name: 'sibling-object2',
                  type: 'object',
                  logic: { required: false },
                  children: [
                    {
                      id: 'obj2-field',
                      name: 'obj2-field',
                      type: 'number',
                      logic: { required: false }
                    }
                  ]
                }
              },
              {
                id: 'array3',
                name: 'array3',
                type: 'array',
                logic: { required: false },
                arrayItemType: {
                  id: 'sibling-object3',
                  name: 'sibling-object3',
                  type: 'object',
                  logic: { required: false },
                  children: [
                    {
                      id: 'obj3-field',
                      name: 'obj3-field',
                      type: 'email',
                      logic: { required: false }
                    }
                  ]
                }
              }
            ]
          }
        ]
      };

      console.log('=== SIBLING: BEFORE ARRAY ITEM OBJECT DELETION ===');
      console.log('Array1 has arrayItemType:', !!siblingSchema.fields[0].children[0].arrayItemType);
      console.log('Array2 has arrayItemType:', !!siblingSchema.fields[0].children[1].arrayItemType);
      console.log('Array3 has arrayItemType:', !!siblingSchema.fields[0].children[2].arrayItemType);

      const result = Schema.delete.field('target-object1', siblingSchema);

      console.log('=== SIBLING: AFTER ARRAY ITEM OBJECT DELETION ===');
      console.log('Array1 has arrayItemType:', !!result.fields[0].children[0].arrayItemType);
      console.log('Array2 has arrayItemType:', !!result.fields[0].children[1].arrayItemType);
      console.log('Array3 has arrayItemType:', !!result.fields[0].children[2].arrayItemType);

      // Verify only target array item object is replaced with text field
      expect(result.fields[0].children[0].arrayItemType).toBeDefined();
      expect(result.fields[0].children[0].arrayItemType.type).toBe('text');
      expect(result.fields[0].children[0].arrayItemType.name).toBe('target-object1');
      
      // Verify siblings remain intact
      expect(result.fields[0].children[1].arrayItemType).toBeDefined();
      expect(result.fields[0].children[1].arrayItemType.id).toBe('sibling-object2');
      expect(result.fields[0].children[2].arrayItemType).toBeDefined();
      expect(result.fields[0].children[2].arrayItemType.id).toBe('sibling-object3');
      
      // Verify structure integrity
      expect(result.fields[0].children).toHaveLength(3);
      expect(result.fields[0].children[0].id).toBe('array1');
      expect(result.fields[0].children[1].id).toBe('array2');
      expect(result.fields[0].children[2].id).toBe('array3');
    });
  });
});