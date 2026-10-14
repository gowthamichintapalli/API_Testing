import { test, expect } from '@playwright/test';

type CourtTestCase = {
  id: string;
  scenario: string;
  params?: [string, string][];
  expectedStatuses: number[];
  auth?: 'valid' | 'missing' | 'invalid';
};

const testCases: CourtTestCase[] = [

  {
    id: 'TC-001',
    scenario: 'pageNumber = 0',
    params: [['pageNumber', '0']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-002',
    scenario: 'pageNumber = -1 negative number',
    params: [['pageNumber', '-1']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-003',
    scenario: 'perPage = 101',
    params: [['perPage', '101']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-004',
    scenario: 'pageNumber contains alphabetic text',
    params: [['pageNumber', 'abc']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-005',
    scenario: 'pageNumber = 2.5',
    params: [['pageNumber', '2.5']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-006',
    scenario: 'pageNumber is empty',
    params: [['pageNumber', '']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-007',
    scenario: 'perPage = 0',
    params: [['perPage', '0']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-008',
    scenario: 'perPage = -1',
    params: [['perPage', '-1']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-009',
    scenario: 'perPage = 99999',
    params: [['perPage', '99999']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-010',
    scenario: 'perPage = 10.5',
    params: [['perPage', '10.5']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-011',
    scenario: 'perPage contains alphabetic text',
    params: [['perPage', 'abc']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-012',
    scenario: 'sortBy is invalid',
    params: [['sortBy', 'Invalid']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-013',
    scenario: 'sortBy = createdBy',
    params: [['sortBy', 'createdBy']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-014',
    scenario: 'sortBy contains unsupported text',
    params: [['sortBy', 'TEST']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-015',
    scenario: 'sortBy is empty',
    params: [['sortBy', '']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-016',
    scenario: 'orderBy is empty',
    params: [['orderBy', '']],
    expectedStatuses: [400],
  },
  {
    id: 'TC-017',
    scenario: 'searchFields contains invalid field',
    params: [
      ['search', 'test'],
      ['searchFields', 'invalid'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-018',
    scenario: 'searchFields contains unsupported createdAt',
    params: [
      ['search', 'test'],
      ['searchFields', 'createdAt'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-019',
    scenario: 'search is empty',
    params: [['search', '']],
    expectedStatuses: [200, 400],
  },
  {
    id: 'TC-020',
    scenario: 'searchFields contains valid and invalid fields',
    params: [
      ['search', 'test'],
      ['searchFields', 'name,invalid'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-021',
    scenario: 'duplicate searchFields parameters',
    params: [
      ['searchFields', 'email'],
      ['searchFields', 'id'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-022',
    scenario: 'missing API key',
    auth: 'missing',
    expectedStatuses: [401],
  },
  {
    id: 'TC-023',
    scenario: 'invalid API key',
    auth: 'invalid',
    expectedStatuses: [401],
  },
  {
    id: 'TC-024',
    scenario: 'invalid pageNumber combined with invalid sortBy',
    params: [
      ['pageNumber', '0'],
      ['sortBy', 'name'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-025',
    scenario: 'valid pageNumber combined with invalid sortBy',
    params: [
      ['pageNumber', '1'],
      ['sortBy', 'invalid'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-026',
    scenario: 'invalid pageNumber combined with excessive perPage',
    params: [
      ['pageNumber', '-1'],
      ['perPage', '101'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-027',
    scenario: 'search with invalid searchFields',
    params: [
      ['search', 'Central'],
      ['searchFields', 'invalid'],
    ],
    expectedStatuses: [400],
  },
  {
    id: 'TC-028',
    scenario: 'search with a very long input',
    params: [
      ['search', 'A'.repeat(50)],
      ['searchFields', 'name'],
    ],
    expectedStatuses: [200, 413],
  },
  {
    id: 'TC-029',
    scenario: 'search with SQL injection-like input',
    params: [
      ['search', "' OR 1=1 --"],
      ['searchFields', 'name'],
    ],
    expectedStatuses: [200, 400],
  },
  {
    id: 'TC-030',
    scenario: 'search with script-like input',
    params: [
      ['search', '<script>alert(1)</script>'],
      ['searchFields', 'name'],
    ],
    expectedStatuses: [200, 400],
  },
   {
    id: 'TC-031',
    scenario: 'pageNumber = 1, perPage = 10 , sortBy = updatedAt, orderBy = Desc ,  searchFields = zip - All default values',
    params: [
        ['pageNumber', '1'], ['perPage', '10'], ['sortBy', 'updatedAt'], ['orderBy', 'DESC'], ['searchFields', 'zip']
    ],
    expectedStatuses: [200],
  },
];

test.describe('GET /v1/courts - Test Cases', () => {
  for (const testCase of testCases) {
    test(`${testCase.id} - ${testCase.scenario}`, async ({ request }) => {      //used template literals 
      const apiKey = process.env.API_KEY;

      if (testCase.auth === 'valid' || !testCase.auth) {
      expect(apiKey).toBeTruthy();
}

      const headers: Record<string, string> = {};

      if (testCase.auth === 'valid') {
        headers['x-api-key'] = apiKey!;
      } else if (testCase.auth === 'invalid') {
        headers['x-api-key'] = 'invalid-test-key';
      }

      if (!testCase.auth) {
        headers['x-api-key'] = apiKey!;
      }

    //   const query = new URLSearchParams(testCase.params ?? []);
    //   const queryString = query.toString();
     const params: [string, string][] = testCase.params ?? [];

    const query = new URLSearchParams(params);
    const queryString = query.toString();

      const endpoint = queryString
        ? `/v1/courts?${queryString}`
        : '/v1/courts';

      const response = await request.get(endpoint, {
        headers,
      });

      const actualStatus = response.status();

      console.log(
        `[${testCase.id}] ${testCase.scenario} | Expected: ${testCase.expectedStatuses.join( ' or ')} | Actual: ${actualStatus}`
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