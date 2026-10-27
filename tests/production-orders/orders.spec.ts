import { expect, test } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import {
  getNamedValues,
  getOrderId,
  observeResponse,
} from '../../utils/api-observation';

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

type CaseNumber = {
  ord_cas_can_case_no: string;
  ord_cas_can_doi_beg: string;
  ord_cas_can_doi_end: string;
};

type InsuranceCarrier = {
  ord_ins_id_selected: string;
  ord_ins_name: string;
  ord_ins_address_street: string;
  ord_ins_address_city: string;
  ord_ins_address_state: string;
  ord_ins_address_zip: string;
  ord_ins_address_phone?: string;
  ord_ins_address_phone_fax?: string;
  ord_adj_name?: string;
  ord_adj_phone?: string;
  ord_adj_phone_fax?: string;
  ord_adj_email?: string;
  ord_adj_claim_id?: string;
};

type OpposingCounsel = {
  ord_csl_id_selected: string;
  ord_csl_name: string;
  ord_csl_address_street: string;
  ord_csl_address_city: string;
  ord_csl_address_state: string;
  ord_csl_address_zip: string;
  ord_csl_address_phone?: string;
  ord_csl_address_phone_fax?: string;
};

type OrderLocation = {
  ord_priority: string;
  ord_rec_type: string;
  ord_rec_dates_needed: string;
  ord_loc_id_selected: string;
  ord_loc_name: string;
  ord_loc_address_street: string;
  ord_loc_address_city: string;
  ord_loc_address_state: string;
  ord_loc_address_zip: string;
  ord_loc_address_phone?: string;
  ord_loc_address_phone_fax?: string;
  ord_special_instructions: string;
  ord_additional_information: string;
};

type CreateOrderRequest = {
  request: string;
  autoDeployToDB: string;
  token: string;
  ord_api_source_id: number;
  ord_svt_type: string;
  ord_svs_type: string;
  case_numbers: CaseNumber[];
  ord_cas_crt_id_selected: string;
  ord_cas_lor_date: string;
  insurance_carriers: InsuranceCarrier[];
  opposing_counsels: OpposingCounsel[];
  ord_emp_name: string;
  ord_pat_name: string;
  ord_pat_aka?: string;
  ord_pat_dob: string;
  ord_pat_ssn: string;
  ord_pat_address_street: string;
  ord_pat_address_city: string;
  ord_pat_address_state: string;
  ord_pat_address_zip: string;
  locations: OrderLocation[];
  attachments: Array<Record<string, string>>;
};

type OrderRequestPayload = Partial<
  Omit<CreateOrderRequest, 'request'>
> & {
  request?: unknown;
  [key: string]: unknown;
};

type OrderTestCase = {
  id: string;
  scenario: string;
  expectedStatus: number;
  set?: Record<string, unknown>;
  remove?: string[];
};

function setValue(body: OrderRequestPayload, path: string, value: unknown): void {
  const segments = path.split('.');
  let current: unknown = body;

  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(current)) {
      current = current[Number(segment)];
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Cannot set ${path}: ${segment} is not a container.`);
    }
  }

  const key = segments[segments.length - 1];
  if (Array.isArray(current)) {
    current[Number(key)] = value;
  } else if (typeof current === 'object' && current !== null) {
    (current as Record<string, unknown>)[key] = value;
  } else {
    throw new Error(`Cannot set ${path}: parent is not a container.`);
  }
}

function removeValue(body: OrderRequestPayload, path: string): void {
  const segments = path.split('.');
  let current: unknown = body;

  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(current)) {
      current = current[Number(segment)];
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Cannot remove ${path}: ${segment} is not a container.`);
    }
  }

  const key = segments[segments.length - 1];
  if (Array.isArray(current)) {
    current.splice(Number(key), 1);
  } else if (typeof current === 'object' && current !== null) {
    delete (current as Record<string, unknown>)[key];
  } else {
    throw new Error(`Cannot remove ${path}: parent is not a container.`);
  }
}

const validOrderBody : CreateOrderRequest = {
  request: 'createOrder',
  autoDeployToDB: 'true',
  token: process.env.TOKEN!,
  ord_api_source_id: 1000005,
  ord_svt_type: 'WC',
  ord_svs_type: 'SIBTF',
  case_numbers: [
    {
      ord_cas_can_case_no: 'TESTCASE123',
      ord_cas_can_doi_beg: '2026-10-04',
      ord_cas_can_doi_end: '2026-10-11',
    },
  ],
  ord_cas_crt_id_selected: 'ac906346-2551-7b4a-b38a-dbca6bc85698',
  ord_cas_lor_date: '2026-10-20',
  insurance_carriers: [
    {
      ord_ins_id_selected: '67845bd7-483c-824b-b02f-c9e8291779ff',
      ord_ins_name: 'Sea Bright Insurance',
      ord_ins_address_street: 'P.O. BOX 11027',
      ord_ins_address_city: 'Orange Grove',
      ord_ins_address_state: 'CA',
      ord_ins_address_zip: '92857',
    },
  ],
  opposing_counsels: [
    {
      ord_csl_id_selected: '672a4d67-3629-ae48-a9d9-01c8edd1514b',
      ord_csl_name: 'Law Offices of Frank H. Canter',
      ord_csl_address_street: '4717 Van Nuys Blvd., Suite 103',
      ord_csl_address_city: 'Sherman Oaks',
      ord_csl_address_state: 'CA',
      ord_csl_address_zip: '91403',
    },
  ],
  ord_emp_name: 'Sai Prakash',
  ord_pat_name: 'Sai Pranav',
  ord_pat_dob: '2004-05-01',
  ord_pat_ssn: '293-87-4981',
  ord_pat_address_street: '5-7/B-56/93 L/1',
  ord_pat_address_city: 'Valley City',
  ord_pat_address_state: 'NY',
  ord_pat_address_zip: '52000',
  locations: [
    {
      ord_priority: 'Standard',
      ord_rec_type: 'MED',
      ord_rec_dates_needed: 'Any and All',
      ord_loc_id_selected: 'b533bbd2-7dfc-334d-af33-b6d54593cc62',
      ord_loc_name: 'Central Valley Occupational Medical Group - Bakersfield',
      ord_loc_address_street: '4100 Truxtun Ave # 200',
      ord_loc_address_city: 'Bakersfield',
      ord_loc_address_state: 'CA',
      ord_loc_address_zip: '93309',
      ord_special_instructions: '',
      ord_additional_information: 'Sample',
    },
  ],
  attachments: [
    {
      id: '94a18f1f-b5bd-4f85-85c8-04a63f094e71',
      storage_path:
        'middleware/dev/accounts/13/orders/48755561-5783-49a2-a40f-0f41648747f9/ord-12551.png',
      storage_provider: 'azure-files',
      storage_account: 'storagerealtimerecs',
      storage_container: 'realtimerecs',
    },
  ],
};

const testCases: OrderTestCase[] = [
  { id: 'TC_01', scenario: 'Create an order with all required fields containing valid values', expectedStatus: 200 },
  { id: 'TC_02', scenario: 'Create an order with valid Workers Compensation and SIBTF service types', expectedStatus: 200, set: { ord_svt_type: 'WC', ord_svs_type: 'SIBTF' } },
  { id: 'TC_03', scenario: 'Create an order with valid Workers Compensation and IMR service types', expectedStatus: 200, set: { ord_svt_type: 'WC', ord_svs_type: 'IMR' } },
  { id: 'TC_04', scenario: 'Create an order with a valid Personal Injury service type', expectedStatus: 200, set: { ord_svt_type: 'PI', ord_svs_type: '' } },
  { id: 'TC_05', scenario: 'Create an order with a valid Civil service type', expectedStatus: 200, set: { ord_svt_type: 'CIVIL', ord_svs_type: '' } },
  { id: 'TC_06', scenario: 'Create an order with multiple case numbers', expectedStatus: 400, set: {
    case_numbers: [
      { ord_cas_can_case_no: 'TESTCASE123', ord_cas_can_doi_beg: '2026-10-04', ord_cas_can_doi_end: '2026-10-11' },
      { ord_cas_can_case_no: 'CASE456ABC', ord_cas_can_doi_beg: '2026-05-01', ord_cas_can_doi_end: '2026-05-10' },
    ],
  } },
  { id: 'TC_07', scenario: 'Create an order with a case number containing letters and numbers', expectedStatus: 200, set: { 'case_numbers.0.ord_cas_can_case_no': 'CASE123ABC' } },
  { id: 'TC_08', scenario: 'Create an order with valid dates of injury in YYYY-MM-DD format', expectedStatus: 200 },
  { id: 'TC_09', scenario: 'Create an order with a valid court ID selected from the repository', expectedStatus: 200 },
  { id: 'TC_10', scenario: 'Create an order with a valid letter of representation date', expectedStatus: 200 },
  { id: 'TC_11', scenario: 'Create an order with multiple insurance carriers', expectedStatus: 200, set: {
    insurance_carriers: [
      { ...validOrderBody.insurance_carriers[0] },
      { ...validOrderBody.insurance_carriers[0], ord_ins_name: 'Second Sea Bright Insurance', ord_ins_address_street: 'P.O. BOX 11028' },
    ]
     }
    },
     { id: 'TC_11-1', scenario: 'Create an order with multiple insurance carriers', expectedStatus: 200, set: {
    insurance_carriers: [
      { ...validOrderBody.insurance_carriers[1] },
      { ...validOrderBody.insurance_carriers[1], ord_ins_name: 'Second Sea Bright Insurance', ord_ins_address_street: 'P.O. BOX 11028' },
    ]
  }
},

  { id: 'TC_12', scenario: 'Create an order without opposing counsel', expectedStatus: 200, set: { opposing_counsels: [] } },
  { id: 'TC_13', scenario: 'Create an order with multiple opposing counsels', expectedStatus: 200, set: {
    opposing_counsels: [
      { ...validOrderBody.opposing_counsels[0] },
      { ...validOrderBody.opposing_counsels[0], ord_csl_name: 'Second Law Office', ord_csl_address_street: '4720 Van Nuys Blvd.' },
    ],
  } },
  { id: 'TC_14', scenario: 'Create an order with an employer name containing spaces', expectedStatus: 200, set: { ord_emp_name: 'ABC Manufacturing Company' } },
  { id: 'TC_15', scenario: 'Create an order with a valid patient first and last name', expectedStatus: 200, set: { ord_pat_name: 'Sai Pranav' } },
  { id: 'TC_16', scenario: 'Create an order with an empty patient alias because no alias is available', expectedStatus: 200, set: { ord_pat_aka: '' } },
  { id: 'TC_17', scenario: 'Create an order with a valid patient date of birth', expectedStatus: 200, set: { ord_pat_dob: '2004-05-01' } },
  { id: 'TC_18', scenario: 'Create an order with a valid patient SSN', expectedStatus: 200, set: { ord_pat_ssn: '293-87-4981' } },
  { id: 'TC_19', scenario: 'Create an order with a valid patient address and five-digit ZIP code', expectedStatus: 200, set: {
    ord_pat_address_street: '123 Main Street',
    ord_pat_address_city: 'Los Angeles',
    ord_pat_address_state: 'CA',
    ord_pat_address_zip: '90001',
  } },
  { id: 'TC_20', scenario: 'Create an order requesting medical records', expectedStatus: 200, set: { 'locations.0.ord_rec_type': 'MED' } },
  { id: 'TC_21', scenario: 'Create an order requesting X-ray and MRI records', expectedStatus: 200, set: { 'locations.0.ord_rec_type': 'RAD' } },
  { id: 'TC_22', scenario: 'Create an order requesting billing records', expectedStatus: 200, set: { 'locations.0.ord_rec_type': 'BIL' } },
  { id: 'TC_23', scenario: 'Create an order requesting insurance records', expectedStatus: 200, set: { 'locations.0.ord_rec_type': 'INS' } },
  { id: 'TC_24', scenario: 'Create an order requesting employment records', expectedStatus: 200, set: { 'locations.0.ord_rec_type': 'EMP' } },
  { id: 'TC_25', scenario: 'Create an order with multiple record locations', expectedStatus: 200, set: {
    locations: [
      { ...validOrderBody.locations[0] },
      { ...validOrderBody.locations[0], ord_loc_name: 'Second Records Location', ord_loc_address_street: '4110 Truxtun Ave # 200' },
    ],
  } },
  { id: 'TC_26', scenario: 'Create an order without optional attachments', expectedStatus: 200, remove: ['attachments'] },
  { id: 'TC_27', scenario: 'Create an order with empty special instructions', expectedStatus: 200, set: { 'locations.0.ord_special_instructions': '' } },
  { id: 'TC_28', scenario: 'Create an order with additional information', expectedStatus: 200, set: { 'locations.0.ord_additional_information': 'Please provide complete records' } },
  { id: 'TC_29', scenario: 'Create an order with the default API source ID', expectedStatus: 200, set: { ord_api_source_id: 1000005 } },
  { id: 'TC_30', scenario: 'Create an order with automatic database deployment enabled', expectedStatus: 200, set: { autoDeployToDB: true } },

  { id: 'TC_31', scenario: 'Create an order without the required request operation name', expectedStatus: 400, remove: ['request'] },
  { id: 'TC_32', scenario: 'Create an order with an incorrect operation name', expectedStatus: 400, set: { request: 'createOrders' } },
  { id: 'TC_33', scenario: 'Create an order without the required service type', expectedStatus: 400, remove: ['ord_svt_type'] },
  { id: 'TC_34', scenario: 'Create an order with an unsupported service type', expectedStatus: 400, set: { ord_svt_type: 'XYZ' } },
  { id: 'TC_35', scenario: 'Create an order with a lowercase service type', expectedStatus: 400, set: { ord_svt_type: 'wc' } },
  { id: 'TC_36', scenario: 'Create an order without the required service sub-type', expectedStatus: 400, remove: ['ord_svs_type'] },
  { id: 'TC_37', scenario: 'Create a Workers\' Compensation order with an unsupported sub-service type', expectedStatus: 400, set: { ord_svt_type: 'WC', ord_svs_type: 'INVALID' } },
  { id: 'TC_38', scenario: 'Create an order without the case numbers array', expectedStatus: 400, remove: ['case_numbers'] },
  { id: 'TC_39', scenario: 'Create an order with an empty case numbers array', expectedStatus: 400, set: { case_numbers: [] } },
  { id: 'TC_40', scenario: 'Create an order without a case number value', expectedStatus: 400, remove: ['case_numbers.0.ord_cas_can_case_no'] },
  { id: 'TC_41', scenario: 'Create an order with an empty case number', expectedStatus: 400, set: { 'case_numbers.0.ord_cas_can_case_no': '' } },
  { id: 'TC_42', scenario: 'Create an order without the beginning date of injury', expectedStatus: 400, remove: ['case_numbers.0.ord_cas_can_doi_beg'] },
  { id: 'TC_43', scenario: 'Create an order without the ending date of injury', expectedStatus: 400, remove: ['case_numbers.0.ord_cas_can_doi_end'] },
  { id: 'TC_44', scenario: 'Create an order without the letter of representation date', expectedStatus: 400, remove: ['ord_cas_lor_date'] },
  { id: 'TC_45', scenario: 'Create an order without the insurance carriers array', expectedStatus: 400, remove: ['insurance_carriers'] },
  { id: 'TC_46', scenario: 'Create an order with an empty insurance carriers array', expectedStatus: 400, set: { insurance_carriers: [] } },
  { id: 'TC_47', scenario: 'Create an order without the employer name', expectedStatus: 400, remove: ['ord_emp_name'] },
  { id: 'TC_48', scenario: 'Create an order with an empty employer name', expectedStatus: 400, set: { ord_emp_name: '' } },
  { id: 'TC_49', scenario: 'Create an order without the patient name', expectedStatus: 400, remove: ['ord_pat_name'] },
  { id: 'TC_50', scenario: 'Create an order with an empty patient name', expectedStatus: 400, set: { ord_pat_name: '' } },
  { id: 'TC_51', scenario: 'Create an order without the patient date of birth', expectedStatus: 400, remove: ['ord_pat_dob'] },
  { id: 'TC_52', scenario: 'Create an order without the patient SSN', expectedStatus: 400, remove: ['ord_pat_ssn'] },
  { id: 'TC_53', scenario: 'Create an order without the patient street address', expectedStatus: 400, remove: ['ord_pat_address_street'] },
  { id: 'TC_54', scenario: 'Create an order without the patient city', expectedStatus: 400, remove: ['ord_pat_address_city'] },
  { id: 'TC_55', scenario: 'Create an order without the patient state', expectedStatus: 400, remove: ['ord_pat_address_state'] },
  { id: 'TC_56', scenario: 'Create an order without the patient ZIP code', expectedStatus: 400, remove: ['ord_pat_address_zip'] },
  { id: 'TC_57', scenario: 'Create an order without the locations array', expectedStatus: 400, remove: ['locations'] },
  { id: 'TC_58', scenario: 'Create an order with an empty locations array', expectedStatus: 400, set: { locations: [] } },

  { id: 'TC_59', scenario: 'Create an order with a letter of representation date in an invalid format', expectedStatus: 400, set: { ord_cas_lor_date: '20-10-2026' } },
  { id: 'TC_60', scenario: 'Create an order with an impossible month in the letter of representation date', expectedStatus: 400, set: { ord_cas_lor_date: '2026-13-20' } },
  { id: 'TC_61', scenario: 'Create an order with an impossible day in the letter of representation date', expectedStatus: 400, set: { ord_cas_lor_date: '2026-02-30' } },
  { id: 'TC_62', scenario: 'Create an order with the letter of representation date supplied as a number', expectedStatus: 400, set: { ord_cas_lor_date: 20261020 } },
  { id: 'TC_63', scenario: 'Create an order with the beginning date of injury later than the ending date', expectedStatus: 400, set: {
    'case_numbers.0.ord_cas_can_doi_beg': '2026-10-12',
    'case_numbers.0.ord_cas_can_doi_end': '2026-10-11',
  } },
  { id: 'TC_64', scenario: 'Create an order with the patient date of birth in an invalid format', expectedStatus: 400, set: { ord_pat_dob: '01-05-2004' } },
  { id: 'TC_65', scenario: 'Create an order with an impossible patient date of birth', expectedStatus: 400, set: { ord_pat_dob: '2004-02-30' } },
  { id: 'TC_66', scenario: 'Create an order with a future patient date of birth', expectedStatus: 400, set: { ord_pat_dob: '2035-01-01' } },
  { id: 'TC_67', scenario: 'Create an order with the beginning date of injury in an invalid format', expectedStatus: 400, set: { 'case_numbers.0.ord_cas_can_doi_beg': '04/10/2026' } },
  { id: 'TC_68', scenario: 'Create an order with the ending date of injury in an invalid format', expectedStatus: 400, set: { 'case_numbers.0.ord_cas_can_doi_end': '11/10/2026' } },

  { id: 'TC_69', scenario: 'Create an order with a ZIP code containing exactly five digits', expectedStatus: 200, set: { ord_pat_address_zip: '12345' } },
  { id: 'TC_70', scenario: 'Create an order with a ZIP code containing fewer than five digits', expectedStatus: 400, set: { ord_pat_address_zip: '1234' } },
  { id: 'TC_71', scenario: 'Create an order with a ZIP code containing more than five digits', expectedStatus: 400, set: { ord_pat_address_zip: '123456' } },
  { id: 'TC_72', scenario: 'Create an order with a ZIP code containing only letters', expectedStatus: 400, set: { ord_pat_address_zip: 'ABCDE' } },
  { id: 'TC_73', scenario: 'Create an order with a ZIP code containing letters and numbers', expectedStatus: 400, set: { ord_pat_address_zip: '12AB5' } },
  { id: 'TC_74', scenario: 'Create an order with a ZIP code containing special characters', expectedStatus: 400, set: { ord_pat_address_zip: '12@45' } },
  { id: 'TC_75', scenario: 'Create an order with a ZIP code containing only spaces', expectedStatus: 400, set: { ord_pat_address_zip: '     ' } },
  { id: 'TC_76', scenario: 'Create an order with a ZIP code supplied as a number instead of a string', expectedStatus: 400, set: { ord_pat_address_zip: 12345 } },

  { id: 'TC_77', scenario: 'Create an order with a patient name containing letters and spaces', expectedStatus: 200, set: { ord_pat_name: 'Sai Pranav' } },
  { id: 'TC_78', scenario: 'Create an order with a patient name containing only spaces', expectedStatus: 400, set: { ord_pat_name: '     ' } },
  { id: 'TC_79', scenario: 'Create an order with a patient name containing numbers', expectedStatus: 400, set: { ord_pat_name: 'Sai12345' } },
  { id: 'TC_80', scenario: 'Create an order with a patient name containing unsupported special characters', expectedStatus: 400, set: { ord_pat_name: 'Sai@#$123' } },
  { id: 'TC_81', scenario: 'Create an order with a patient name supplied as a number', expectedStatus: 400, set: { ord_pat_name: 12345 } },
  { id: 'TC_82', scenario: 'Create an order with an employer name containing only spaces', expectedStatus: 400, set: { ord_emp_name: '     ' } },
  { id: 'TC_83', scenario: 'Create an order with an employer name containing numbers and special characters', expectedStatus: 400, set: { ord_emp_name: 'Company@123!' } },
  { id: 'TC_84', scenario: 'Create an order with an employer name supplied as a number', expectedStatus: 400, set: { ord_emp_name: 12345 } },

  { id: 'TC_85', scenario: 'Create an order with an SSN containing fewer than nine digits', expectedStatus: 400, set: { ord_pat_ssn: '293-87-498' } },
  { id: 'TC_86', scenario: 'Create an order with an SSN containing more than nine digits', expectedStatus: 400, set: { ord_pat_ssn: '293-87-49811' } },
  { id: 'TC_87', scenario: 'Create an order with an SSN containing alphabetic characters', expectedStatus: 400, set: { ord_pat_ssn: 'ABC-DE-FGHI' } },
  { id: 'TC_88', scenario: 'Create an order with an SSN without the required separators', expectedStatus: 400, set: { ord_pat_ssn: '293874981' } },
  { id: 'TC_89', scenario: 'Create an order with an SSN containing special characters', expectedStatus: 400, set: { ord_pat_ssn: '293-87-49@1' } },

  { id: 'TC_90', scenario: 'Create an order with an insurance carrier missing its selected ID', expectedStatus: 400, remove: ['insurance_carriers.0.ord_ins_id_selected'] },
  { id: 'TC_91', scenario: 'Create an order with an empty insurance carrier name', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_name': '' } },
  { id: 'TC_92', scenario: 'Create an order with an insurance carrier name containing only spaces', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_name': '     ' } },
  { id: 'TC_93', scenario: 'Create an order with an insurance carrier name supplied as a number', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_name': 12345 } },
  { id: 'TC_94', scenario: 'Create an order with an empty insurance carrier street address', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_address_street': '' } },
  { id: 'TC_95', scenario: 'Create an order with an empty insurance carrier city', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_address_city': '' } },
  { id: 'TC_96', scenario: 'Create an order with an empty insurance carrier state', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_address_state': '' } },
  { id: 'TC_97', scenario: 'Create an order with an insurance carrier state containing more than two letters', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_address_state': 'CAL' } },
  { id: 'TC_98', scenario: 'Create an order with an insurance carrier ZIP code containing four digits', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_address_zip': '1234' } },
  { id: 'TC_99', scenario: 'Create an order with an insurance carrier ZIP code containing six digits', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_address_zip': '123456' } },
  { id: 'TC_100', scenario: 'Create an order with an insurance carrier ZIP code containing letters', expectedStatus: 400, set: { 'insurance_carriers.0.ord_ins_address_zip': 'ABCDE' } },

  { id: 'TC_101', scenario: 'Create an order with an opposing counsel missing its selected ID', expectedStatus: 400, remove: ['opposing_counsels.0.ord_csl_id_selected'] },
  { id: 'TC_102', scenario: 'Create an order with an empty opposing counsel name', expectedStatus: 400, set: { 'opposing_counsels.0.ord_csl_name': '' } },
  { id: 'TC_103', scenario: 'Create an order with an opposing counsel name containing only spaces', expectedStatus: 400, set: { 'opposing_counsels.0.ord_csl_name': '     ' } },
  { id: 'TC_104', scenario: 'Create an order with an empty opposing counsel street address', expectedStatus: 400, set: { 'opposing_counsels.0.ord_csl_address_street': '' } },
  { id: 'TC_105', scenario: 'Create an order with an empty opposing counsel city', expectedStatus: 400, set: { 'opposing_counsels.0.ord_csl_address_city': '' } },
  { id: 'TC_106', scenario: 'Create an order with an opposing counsel state containing more than two letters', expectedStatus: 400, set: { 'opposing_counsels.0.ord_csl_address_state': 'CAL' } },
  { id: 'TC_107', scenario: 'Create an order with an opposing counsel ZIP code containing fewer than five digits', expectedStatus: 400, set: { 'opposing_counsels.0.ord_csl_address_zip': '1234' } },
  { id: 'TC_108', scenario: 'Create an order with an opposing counsel ZIP code containing letters and numbers', expectedStatus: 400, set: { 'opposing_counsels.0.ord_csl_address_zip': '12ABC' } },

  { id: 'TC_109', scenario: 'Create an order with a location missing its selected location ID', expectedStatus: 400, remove: ['locations.0.ord_loc_id_selected'] },
  { id: 'TC_110', scenario: 'Create an order with an empty location name', expectedStatus: 400, set: { 'locations.0.ord_loc_name': '' } },
  { id: 'TC_111', scenario: 'Create an order with an empty location street address', expectedStatus: 400, set: { 'locations.0.ord_loc_address_street': '' } },
  { id: 'TC_112', scenario: 'Create an order with an empty location city', expectedStatus: 400, set: { 'locations.0.ord_loc_address_city': '' } },
  { id: 'TC_113', scenario: 'Create an order with an empty location state', expectedStatus: 400, set: { 'locations.0.ord_loc_address_state': '' } },
  { id: 'TC_114', scenario: 'Create an order with a location ZIP code containing fewer than five digits', expectedStatus: 400, set: { 'locations.0.ord_loc_address_zip': '1234' } },
  { id: 'TC_115', scenario: 'Create an order with a location ZIP code containing more than five digits', expectedStatus: 400, set: { 'locations.0.ord_loc_address_zip': '123456' } },
  { id: 'TC_116', scenario: 'Create an order with a location ZIP code containing letters and numbers', expectedStatus: 400, set: { 'locations.0.ord_loc_address_zip': '12AB5' } },
  { id: 'TC_117', scenario: 'Create an order with an unsupported record type', expectedStatus: 400, set: { 'locations.0.ord_rec_type': 'XYZ' } },
  { id: 'TC_118', scenario: 'Create an order with a lowercase record type', expectedStatus: 400, set: { 'locations.0.ord_rec_type': 'med' } },
  { id: 'TC_119', scenario: 'Create an order with an unsupported record priority', expectedStatus: 400, set: { 'locations.0.ord_priority': 'UrgentUnknown' } },
  { id: 'TC_120', scenario: 'Create an order with an empty record dates needed field', expectedStatus: 400, set: { 'locations.0.ord_rec_dates_needed': '' } },
];

const baseUrl = process.env.API_BASE_URL;
const token = process.env.TOKEN;

if (!baseUrl) throw new Error('API_BASE_URL is missing in .env');
if (!token) throw new Error('TOKEN is missing in .env');

type CaseResult = {
  id: string;
  scenario: string;
  expectedStatus: number;
  actualStatus: string;
  passed: boolean;
};

test.describe('POST /v1/orders - expected status validation', () => {
  test.describe.configure({ mode: 'default' });

  for (const testCase of testCases) {
    test(`${testCase.id} - ${testCase.scenario}`, async ({ request }, testInfo) => {
      test.setTimeout(120_000);

      const apiBaseUrl = baseUrl!.replace(/\/+$/, '').replace(/\/v1$/, '');
      const endpoint = `${apiBaseUrl}/v1/orders`;
      const body = structuredClone(validOrderBody) as OrderRequestPayload;
      for (const [fieldPath, value] of Object.entries(testCase.set ?? {})) {
        setValue(body, fieldPath, value);
      }
      for (const fieldPath of testCase.remove ?? []) {
        removeValue(body, fieldPath);
      }

      let observation: Awaited<ReturnType<typeof observeResponse>> | undefined;
      let requestError = '';
      try {
        const response = await request.post(endpoint, {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
          },
          data: body,
          timeout: 60_000,
        });
        observation = await observeResponse(response);
      } catch (error) {
        requestError = error instanceof Error ? error.message : String(error);
      }

      const statusMatches = observation?.status === testCase.expectedStatus;
      const passed = Boolean(statusMatches);
      const actualStatus = observation
        ? String(observation.status)
        : requestError
          ? `No response: ${requestError}`
          : 'No response';
      const result: CaseResult = {
        id: testCase.id,
        scenario: testCase.scenario,
        expectedStatus: testCase.expectedStatus,
        actualStatus,
        passed,
      };

      await testInfo.attach('order-case-result', {
        body: Buffer.from(JSON.stringify(result)),
        contentType: 'application/json',
      });

      const report = [
        '========================================================',
        `Test Case      : ${testCase.id}`,
        `Scenario       : ${testCase.scenario}`,
        'Method         : POST',
        'Endpoint       : /v1/orders',
        `Test Status    : ${passed ? 'PASS' : 'FAIL'}`,
        `Expected Status: ${testCase.expectedStatus}`,
        `Actual Status  : ${actualStatus}`,
        '======================================================',
        'CREATE RESPONSE',
      ];

      if (observation) {
        report.push(
          `Status code        : ${observation.status}`,
          `Order ID           : ${getOrderId(observation.body) || 'Not found'}`,
          `Content-Type       : ${observation.contentType}`,
          `Response format    : ${observation.responseFormat}`,
          `Success / errors   : ${getNamedValues(observation.body, new Set(['success', 'error', 'message'])).join(' | ') || 'Not present'}`,
          `Empty strings      : [${observation.emptyStringKeys.join(', ')}]`,
          `Empty arrays       : [${observation.emptyArrayKeys.join(', ')}]`,
          `Empty objects      : [${observation.emptyObjectKeys.join(', ')}]`,
          'Missing keys       : [] (not assessed)',
          `Null keys          : [${observation.nullKeys.join(', ')}]`,
        );
      } else {
        report.push(
          'Status code        : No response',
          `Request error       : ${requestError || 'No response received'}`,
        );
      }
      report.push('======================================================');
      console.log(report.join('\n'));

      expect(
        actualStatus,
        `Unexpected status for ${testCase.id} - ${testCase.scenario}`,
      ).toBe(String(testCase.expectedStatus));
    });
  }
});
