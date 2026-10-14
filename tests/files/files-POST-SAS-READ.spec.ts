import { test, expect } from '@playwright/test';

type SasReadTestCase = {
  id: string;
  scenario: string;
  requestBody?: Record<string, unknown>;
  expectedStatuses: number[];
  auth?: 'valid' | 'missing' | 'invalid';
};

const testCases: SasReadTestCase[] = [
 {
    id: 'SAS-001',
    scenario: 'Valid request with filePath and path',
    requestBody: {
      filePath: 'Orders/test.pdf',
      path: 'invoices/2026',
    },
    expectedStatuses: [200],
  },
  {
    id: 'SAS-002',
    scenario: 'Valid request with filePath and fileName',
    requestBody: {
      filePath: 'Orders/test.pdf',
      fileName: 'march-statement.pdf',
    },
    expectedStatuses: [200],
  },
  {
    id: 'SAS-003',
    scenario: 'Valid request with all fields',
    requestBody: {
      filePath: 'Orders/test.pdf',
      path: 'invoices/2026',
      fileName: 'march-statement.pdf',
      expiresInMinutes: 15,
    },
    expectedStatuses: [200],
  },
  {
    id: 'SAS-004',
    scenario: 'Missing filePath',
    requestBody: {
      path: 'invoices/2026',
    },
    expectedStatuses: [400],
  },
  {
    id: 'SAS-005',
    scenario: 'Empty filePath',
    requestBody: {
      filePath: '',
      path: 'invoices/2026',
    },
    expectedStatuses: [400],
  },
  {
    id: 'SAS-006',
    scenario: 'filePath only',
    requestBody: {
      filePath: 'Orders/test.pdf',
    },
    expectedStatuses: [400],
  },
  {
    id: 'SAS-007',
    scenario: 'path only',
    requestBody: {
      path: 'invoices/2026',
    },
    expectedStatuses: [400],
  },
  {
    id: 'SAS-008',
    scenario: 'fileName only',
    requestBody: {
      fileName: 'march-statement.pdf',
    },
    expectedStatuses: [400],
  },
  {
    id: 'SAS-009',
    scenario: 'filePath with empty path and no fileName',
    requestBody: {
      filePath: 'Orders/test.pdf',
      path: '',
    },
    expectedStatuses: [400],
  },
  {
    id: 'SAS-010',
    scenario: 'filePath with empty fileName and no path',
    requestBody: {
      filePath: 'Orders/test.pdf',
      fileName: '',
    },
    expectedStatuses: [400],
  },
  {
    id: 'SAS-011',
    scenario: 'Missing API key',
    auth: 'missing',
    requestBody: {
      filePath: 'Orders/test.pdf',
      path: 'invoices/2026',
    },
    expectedStatuses: [401],
  },
  {
    id: 'SAS-012',
    scenario: 'Invalid API key',
    auth: 'invalid',
    requestBody: {
      filePath: 'Orders/test.pdf',
      path: 'invoices/2026',
    },
    expectedStatuses: [401],
  },
];

test.describe('POST /v1/files/sas/read', () => {
  for (const testCase of testCases) {
    test(`${testCase.id} - ${testCase.scenario}`, async ({ request }) => {
      const apiKey = process.env.API_KEY;

      if (testCase.auth !== 'missing') {
        expect(
          apiKey,
          'Configure API_KEY in the root .env file'
        ).toBeTruthy();
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (testCase.auth === 'valid') {
        headers['x-api-key'] = apiKey!;
      } else if (testCase.auth === 'invalid') {
        headers['x-api-key'] = 'invalid-test-key';
      }

      if (!testCase.auth) {
        headers['x-api-key'] = apiKey!;
      }

      const response = await request.post(
        '/v1/files/sas/read',
        {
          headers,
          data: testCase.requestBody,
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