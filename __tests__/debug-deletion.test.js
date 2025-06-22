const { Schema } = require('../dist/index');

describe('Debug Deep Nested Deletion', () => {
  test('debug step by step - simple 3 level nesting', () => {
    const simpleDeepSchema = {
      id: 'debug-test',
      name: 'Debug Test Schema',
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
                  id: 'target-to-delete',
                  name: 'target-to-delete',
                  type: 'text',
                  logic: { required: false }
                },
                {
                  id: 'sibling-to-keep',
                  name: 'sibling-to-keep',
                  type: 'text',
                  logic: { required: false }
                }
              ]
            }
          ]
        }
      ]
    };

    console.log('=== BEFORE DELETION ===');
    console.log('Level 2 children count:', simpleDeepSchema.fields[0].children[0].children.length);
    console.log('Level 2 children IDs:', simpleDeepSchema.fields[0].children[0].children.map(c => c.id));

    const result = Schema.delete.field('target-to-delete', simpleDeepSchema);

    console.log('=== AFTER DELETION ===');
    console.log('Level 2 children count:', result.fields[0].children[0].children.length);  
    console.log('Level 2 children IDs:', result.fields[0].children[0].children.map(c => c.id));

    // Test expectation
    expect(result.fields[0].children[0].children).toHaveLength(1);
    expect(result.fields[0].children[0].children[0].id).toBe('sibling-to-keep');
  });

  test('debug step by step - check what delete function actually does', () => {
    const testSchema = {
      id: 'test',
      name: 'test',
      fields: [
        {
          id: 'parent',
          name: 'parent',
          type: 'object',
          logic: { required: false },
          children: [
            {
              id: 'child-target',
              name: 'child-target',
              type: 'text',
              logic: { required: false }
            }
          ]
        }
      ]
    };

    console.log('=== INPUT SCHEMA ===');
    console.log(JSON.stringify(testSchema, null, 2));

    console.log('=== CALLING Schema.delete.field ===');
    const result = Schema.delete.field('child-target', testSchema);

    console.log('=== RESULT SCHEMA ===');  
    console.log(JSON.stringify(result, null, 2));

    // Check if the function is actually being called
    console.log('=== COMPARISON ===');
    console.log('Input === Result:', testSchema === result);
    console.log('Input fields === Result fields:', testSchema.fields === result.fields);
    console.log('Parent children length before:', testSchema.fields[0].children.length);
    console.log('Parent children length after:', result.fields[0].children.length);
  });
});
