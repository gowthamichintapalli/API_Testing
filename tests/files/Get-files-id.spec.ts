import { test, expect } from '@playwright/test';

type OrderFilesTestCase = {
  id: string;
  scenario: string;
  orderId: string;
  expectedStatuses: number[];
  auth?: 'valid' | 'missing' | 'invalid';
};

const testCases: OrderFilesTestCase[] = [
  {
    id: 'TC-001',
    scenario: 'Valid orderId',
    orderId: '2261710-001',
    expectedStatuses: [200],
  },
  {
    id: 'TC-002',
    scenario: 'Non-existent orderId',
    orderId: '999999999',
    expectedStatuses: [404],
  },
  {
    id: 'TC-003',
    scenario: 'orderId contains alphabetic text',
    orderId: 'abc',
    expectedStatuses: [400],
  },
  {
    id: 'TC-004',
    scenario: 'orderId contains special characters',
    orderId: '@#$%',
    expectedStatuses: [400],
  },
  {
    id: 'TC-005',
    scenario: 'orderId is negative',
    orderId: '-1',
    expectedStatuses: [400],
  },
  {
    id: 'TC-006',
    scenario: 'orderId is decimal',
    orderId: '1.5',
    expectedStatuses: [400],
  },
  {
    id: 'TC-007',
    scenario: 'orderId is empty',
    orderId: '',
    expectedStatuses: [400, 404],
  },
  {
    id: 'TC-008',
    scenario: 'Very large orderId',
    orderId: '999999999999999999999',
    expectedStatuses: [400, 404],
  },
  {
    id: 'TC-009',
    scenario: 'Missing API key',
    orderId: '1',
    auth: 'missing',
    expectedStatuses: [401],
  },
  {
    id: 'TC-010',
    scenario: 'Invalid API key',
    orderId: '1',
    auth: 'invalid',
    expectedStatuses: [401],
  },
];

test.describe('GET /v1/files/orders/{orderId}/files', () => {
  for (const testCase of testCases) {
    test(`${testCase.id} - ${testCase.scenario}`, async ({ request }) => {
      const apiKey = process.env.API_KEY;

      if (testCase.auth === 'valid' || !testCase.auth) {
        expect(apiKey).toBeTruthy();
      }

       //const headers={};
      const APIheaders: Record<string, string> = {};
     

      if (testCase.auth === 'valid') {
        APIheaders['x-api-key'] = apiKey!;
      } else if (testCase.auth === 'invalid') {
        APIheaders['x-api-key'] = 'invalid-test-key';
      }

      if (!testCase.auth) {
        APIheaders['x-api-key'] = apiKey!;
      }

      const endpoint = `/v1/files/orders/${encodeURIComponent(
        testCase.orderId
      )}/files`;

      const response = await request.get(endpoint, {
        headers: APIheaders,
      });

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