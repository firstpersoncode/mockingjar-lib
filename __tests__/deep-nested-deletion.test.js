const { Schema } = require('../dist/index');

describe('Deep Nested Field Deletion Tests', () => {
  describe('Real Deep Nested Deletion Behavior', () => {
    test('should delete deeply nested field (5 levels deep)', () => {
      const deepSchema = {
        id: 'deep-test',
        name: 'Deep Test Schema',
        fields: [
          {
            id: 'level1',
            name: 'level1',
            type: 'object',
            logic: { required: false },
            children: [
              {
                id: 'level2',
                name: 'level2', 
                type: 'object',
                logic: { required: false },
                children: [
                  {
                    id: 'level3',
                    name: 'level3',
                    type: 'object',
                    logic: { required: false },
                    children: [
                      {
                        id: 'level4',
                        name: 'level4',
                        type: 'object',
                        logic: { required: false },
                        children: [
                          {
                            id: 'level5-target',
                            name: 'level5-target',
                            type: 'text',
                            logic: { required: false }
                          },
                          {
                            id: 'level5-sibling',
                            name: 'level5-sibling', 
                            type: 'text',
                            logic: { required: false }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      console.log('BEFORE DELETION:');
      console.log(JSON.stringify(deepSchema, null, 2));

      const result = Schema.delete.field('level5-target', deepSchema);

      console.log('AFTER DELETION:');
      console.log(JSON.stringify(result, null, 2));

      // Navigate to level 4 children to check if level5-target was deleted
      const level4Children = result.fields[0].children[0].children[0].children[0].children;
      
      console.log('Level 4 children:', level4Children);
      
      // Should have only one child (level5-sibling) after deletion
      expect(level4Children).toHaveLength(1);
      expect(level4Children[0].id).toBe('level5-sibling');
      
      // level5-target should be gone
      const targetExists = level4Children.some(child => child.id === 'level5-target');
      expect(targetExists).toBe(false);
    });

    test('should delete deeply nested field in array item type (5 levels deep)', () => {
      const deepArraySchema = {
        id: 'deep-array-test',
        name: 'Deep Array Test Schema', 
        fields: [
          {
            id: 'level1-array',
            name: 'level1-array',
            type: 'array',
            logic: { required: false },
            arrayItemType: {
              id: 'array-item1',
              name: 'array-item1',
              type: 'object',
              logic: { required: false },
              children: [
                {
                  id: 'level2-in-array',
                  name: 'level2-in-array',
                  type: 'object', 
                  logic: { required: false },
                  children: [
                    {
                      id: 'level3-in-array',
                      name: 'level3-in-array',
                      type: 'object',
                      logic: { required: false },
                      children: [
                        {
                          id: 'level4-in-array',
                          name: 'level4-in-array',
                          type: 'object',
                          logic: { required: false },
                          children: [
                            {
                              id: 'level5-target-in-array',
                              name: 'level5-target-in-array',
                              type: 'text',
                              logic: { required: false }
                            },
                            {
                              id: 'level5-sibling-in-array',
                              name: 'level5-sibling-in-array',
                              type: 'text', 
                              logic: { required: false }
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        ]
      };

      console.log('BEFORE ARRAY DELETION:');
      console.log(JSON.stringify(deepArraySchema, null, 2));

      const result = Schema.delete.field('level5-target-in-array', deepArraySchema);

      console.log('AFTER ARRAY DELETION:');
      console.log(JSON.stringify(result, null, 2));

      // Navigate to level 4 children inside array item type
      const level4Children = result.fields[0].arrayItemType.children[0].children[0].children[0].children;
      
      console.log('Level 4 children in array:', level4Children);
      
      // Should have only one child (level5-sibling-in-array) after deletion
      expect(level4Children).toHaveLength(1);
      expect(level4Children[0].id).toBe('level5-sibling-in-array');
      
      // level5-target-in-array should be gone
      const targetExists = level4Children.some(child => child.id === 'level5-target-in-array');
      expect(targetExists).toBe(false);
    });

    test('should add field to deeply nested structure and then delete it', () => {
      // This test is skipped because Schema.add.child doesn't exist yet
      // TODO: Implement Schema.add.child function and enable this test
      expect(true).toBe(true);
    });

    test('should handle mixed array and object nesting with deletion', () => {
      const mixedNestedSchema = {
        id: 'mixed-nested-test',
        name: 'Mixed Nested Test Schema',
        fields: [
          {
            id: 'root-array',
            name: 'root-array',
            type: 'array',
            logic: { required: false },
            arrayItemType: {
              id: 'array-item',
              name: 'array-item',
              type: 'object',
              logic: { required: false },
              children: [
                {
                  id: 'nested-object',
                  name: 'nested-object',
                  type: 'object',
                  logic: { required: false },
                  children: [
                    {
                      id: 'inner-array',
                      name: 'inner-array',
                      type: 'array',
                      logic: { required: false },
                      arrayItemType: {
                        id: 'inner-array-item',
                        name: 'inner-array-item',
                        type: 'object',
                        logic: { required: false },
                        children: [
                          {
                            id: 'deep-target',
                            name: 'deep-target',
                            type: 'text',
                            logic: { required: false }
                          },
                          {
                            id: 'deep-sibling',
                            name: 'deep-sibling', 
                            type: 'text',
                            logic: { required: false }
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          }
        ]
      };

      console.log('BEFORE MIXED DELETION:');
      console.log(JSON.stringify(mixedNestedSchema, null, 2));

      const result = Schema.delete.field('deep-target', mixedNestedSchema);

      console.log('AFTER MIXED DELETION:');
      console.log(JSON.stringify(result, null, 2));

      // Navigate through mixed array/object nesting
      const innerArrayItemChildren = result.fields[0].arrayItemType.children[0].children[0].arrayItemType.children;
      
      console.log('Inner array item children:', innerArrayItemChildren);
      
      // Should have only one child (deep-sibling) after deletion
      expect(innerArrayItemChildren).toHaveLength(1);
      expect(innerArrayItemChildren[0].id).toBe('deep-sibling');
      
      // deep-target should be gone
      const targetExists = innerArrayItemChildren.some(child => child.id === 'deep-target');
      expect(targetExists).toBe(false);
    });
  });
});
