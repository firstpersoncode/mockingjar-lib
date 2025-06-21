import { generateJsonData } from '../generator';
import { JsonSchema } from '@/types/schema';
import type Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic SDK
const mockAnthropic = {
  messages: {
    create: jest.fn(),
  },
} as unknown as Anthropic;

// Test schema from the user example - based on your TEST.md specification
const testSchema: JsonSchema = {
  name: 'Test Schema',
  fields: [
    {
      id: '0',
      name: 'office',
      type: 'object',
      children: [
        {
          id: '01',
          name: 'tags',
          type: 'array',
          logic: { minItems: 2, maxItems: 5 },
          arrayItemType: {
            id: '011',
            name: 'items',
            type: 'array',
            logic: { minItems: 2, maxItems: 5 },
            arrayItemType: {
              id: '0111',
              name: 'item',
              type: 'object',
              children: [
                {
                  id: '01111',
                  name: 'title',
                  type: 'text',
                  logic: { required: true, minLength: 5, maxLength: 100 },
                },
                {
                  id: '01112',
                  name: 'description',
                  type: 'text',
                  logic: { required: true, minLength: 50 },
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: '2',
      name: 'owner',
      type: 'object',
      children: [
        {
          id: '21',
          name: 'name',
          type: 'text',
          logic: { required: true, minLength: 10, maxLength: 100 },
        },
        {
          id: '22',
          name: 'email',
          type: 'email',
          logic: { required: true },
        },
      ],
    },
    {
      id: '3',
      name: 'active',
      type: 'boolean',
      logic: {
        required: true,
      }
    },
    {
      id: '5',
      name: 'status',
      type: 'text',
      logic: { required: true, enum: ['APPROVED', 'REVIEW', 'PUBLISHED'] },
    },
  ],
};

describe('generateJsonData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockAnthropic.messages.create as jest.Mock).mockReset();
  });

  describe('Initial Generation', () => {
    it('should generate valid data on first attempt', async () => {
      const validResponse = {
        office: {
          tags: [
            [
              {
                title: 'Office Management Tools',
                description:
                  'Tools and software for managing office operations efficiently and effectively with proper documentation',
              },
              {
                title: 'Workplace Solutions',
                description:
                  'Comprehensive solutions for modern workplace challenges including remote work capabilities and collaboration tools',
              },
            ],
            [
              {
                title: 'Team Collaboration',
                description:
                  'Software and platforms designed to enhance team collaboration and communication across different departments and teams',
              },
              {
                title: 'Project Management Tools',
                description:
                  'Comprehensive project management solutions for tracking tasks, deadlines, and team productivity across multiple departments',
              },
            ],
          ],
        },
        owner: {
          name: 'Alice Johnson Manager',
          email: 'alice.johnson@company.com',
        },
        active: true,
        status: 'APPROVED',
      };

      (mockAnthropic.messages.create as jest.Mock).mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify(validResponse) }],
      });

      const result = await generateJsonData(
        mockAnthropic,
        testSchema,
        'Create user data'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([validResponse]);
      expect(result.metadata?.regeneratedFields).toEqual([]);
      expect(mockAnthropic.messages.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Field Repair', () => {
    it('should fix error fields with recursive calls using same prompt template', async () => {
      // First call returns invalid data with errors exactly like your TEST.md example
      const invalidResponse = {
        office: {
          tags: [
            ['SeaShore', 'Oklahoma'], // Invalid: should be objects
            ['Sydney'], // Invalid: should be objects
          ],
        },
        owner: {
          name: 'Alice Johnson Senior',
          // Missing email
        },
        active: 'ACTIVE', // Invalid: should be boolean
        Status: 'APPROVED', // Invalid: unidentified field (wrong case)
      };

      const fixedResponse1 = {
        office: {
          Tags: [
            'Office Management Tools',
            'Workplace Solutions',
            'Team Collaboration',
          ],
        },
        owner: {
          email: 'alice.johnson@company.com',
        },
        active: 'PENDING',
        status: 'APPROVED',
      };

      const fixedResponse2 = {
        office: {
          tags: [
            [
              {
                title: 'Office Management Tools',
                description:
                  'Tools and software for managing office operations efficiently and effectively with proper documentation',
              },
              {
                title: 'Workplace Solutions',
                description:
                  'Comprehensive solutions for modern workplace challenges including remote work capabilities and collaboration tools',
              },
            ],
            [
              {
                title: 'Team Collaboration',
                description:
                  'Software and platforms designed to enhance team collaboration and communication across different departments and teams',
              },
              {
                title: 'Project Management Tools',
                description:
                  'Comprehensive project management solutions for tracking tasks, deadlines, and team productivity across multiple departments',
              },
            ],
          ],
        },
        Active: true,
      };

      const fixedResponse3 = {
        active: true,
      };

      (mockAnthropic.messages.create as jest.Mock)
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify(invalidResponse) }],
        })
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify(fixedResponse1) }],
        })
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify(fixedResponse2) }],
        })
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify(fixedResponse3) }],
        });

      const result = await generateJsonData(
        mockAnthropic,
        testSchema,
        'Create user data',
        { maxAttempts: 4, count: 1 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);

      // Should have fixed the data
      const finalData = result.data?.[0] as Record<string, unknown>;
      const office = finalData.office as Record<string, unknown>;
      const owner = finalData.owner as Record<string, unknown>;
      expect(office.tags as unknown[]).toEqual(
        (fixedResponse2.office as Record<string, unknown>).tags
      );
      expect(owner.email).toBe('alice.johnson@company.com');
      expect(finalData.active).toBe(true);
      expect(finalData.status).toBe('APPROVED');
      expect(finalData).not.toHaveProperty('Status'); // Unidentified field removed

      expect(result.metadata?.regeneratedFields).toContain('office.tags');
      expect(result.metadata?.regeneratedFields).toContain('owner.email');
      expect(result.metadata?.regeneratedFields).toContain('active');
      expect(result.metadata?.regeneratedFields).toContain('status');
      expect(mockAnthropic.messages.create).toHaveBeenCalledTimes(4);
    });
  });
});
