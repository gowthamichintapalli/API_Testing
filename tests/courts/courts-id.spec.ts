import { test, expect } from '@playwright/test';

type CourtByIdTestCase = {
  id: string;
  scenario: string;
  courtId: string;
  expectedStatuses: number[];
  auth?: 'missing' | 'invalid';
};

const testCases: CourtByIdTestCase[] = [
     {
    id: 'TC-001',
    scenario: 'Valid court ID',
    courtId: 'bd101a0a-83c6-c842-b48a-8bc983171aac', 
    expectedStatuses: [200],
  },
  {
    id: 'TC-002',
    scenario: 'Non-existent court ID',
    courtId: 'bd101a0a-83c6-c842-b48a-8bc983171de9',
    expectedStatuses: [404],
  },
  {
    id: 'TC-003',
    scenario: 'Court ID contains alphabetic characters',
    courtId: 'abcjhffhiu',
    expectedStatuses: [400],
  },
  {
    id: 'TC-004',
    scenario: 'Court ID contains special characters',
    courtId: '@#$%',
    expectedStatuses: [400],
  },
  {
    id: 'TC-005',
    scenario: 'Court ID - negative',
    courtId: '-1',
    expectedStatuses: [400],
  },
  {
    id: 'TC-006',
    scenario: 'Court ID - decimal',
    courtId: '1.5',
    expectedStatuses: [400],
  },
  {
    id: 'TC-007',
    scenario: 'Court ID is empty',
    courtId: '',
    expectedStatuses: [404, 400],
  },
  {
    id: 'TC-008',
    scenario: 'Missing API key',
    courtId: 'bd101a0a-83c6-c842-b48a-8bc983171aac',
    auth: 'missing',
    expectedStatuses: [401],
  },
  {
    id: 'TC-009',
    scenario: 'Invalid API key',
    courtId: 'bd101a0a-83c6-c842-b48a-8bc983171aac',
    auth: 'invalid',
    expectedStatuses: [401],
  },
  {
    id: 'TC-010',
    scenario: 'Very long input',
    courtId: '125'.repeat(50),
    expectedStatuses: [400],
  },
  {
    id: 'TC-011',
    scenario: 'Court ID .',
    courtId: "'.",
    expectedStatuses: [400],
  },
  {
    id: 'TC-012',
    scenario: 'Court ID /',
    courtId: '/',
    expectedStatuses: [400] ,
  },
  {
    id: 'TC-013',
    scenario: 'Court ID - Invalid format',
    courtId: '12345',
    expectedStatuses: [400],
  },
{
  id: 'TC-014',
  scenario: 'Court ID without hypen -',
  courtId: 'bd101a0a83c6c842b48a8bc983171aac',
  expectedStatuses: [400],
},
{
  id: 'TC-015',
  scenario: 'Valid format UUID but record does not exist',
  courtId: '11111111-1111-1111-1111-111111111111',
  expectedStatuses: [404],
},
];

test.describe('GET /v1/courts/{id}', () => {
  for (const testCase of testCases) {
    test(`${testCase.id} - ${testCase.scenario}`, async ({ request }) => {
      const apiKey = process.env.API_KEY;

      if (testCase.auth !== 'missing') {
        expect(
          apiKey,
          'Configure API_KEY in the root .env file'
        ).toBeTruthy();
      }

      const headers: Record<string, string> = {};

      if (testCase.auth === 'invalid') {
        headers['x-api-key'] = 'invalid-test-key';
      } else if (testCase.auth !== 'missing') {
        headers['x-api-key'] = apiKey!;
      }

      const response = await request.get(
        `/v1/courts/${encodeURIComponent(testCase.courtId)}`,
        {
          headers,
        }
      );

      const actualStatus = response.status();

      console.log(
        `[${testCase.id}] ${testCase.scenario} | Expected: ${testCase.expectedStatuses.join(
          ' or '
        )} | Actual: ${actualStatus}`
      );

      expect(
        testCase.expectedStatuses.includes(actualStatus),
        `${testCase.id} | ${testCase.scenario} | Expected: ${testCase.expectedStatuses.join(
          ' or '
        )} | Actual: ${actualStatus}`
      ).toBeTruthy();
    });
  }
});