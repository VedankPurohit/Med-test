/** Mock patient data */
export const MOCK_PATIENT = {
  name: 'DOE, JOHN',
  id: 'PAT-2024-00147',
  dob: '14-Mar-1985',
  age: 40,
  gender: 'M',
  weight: '78 kg',
} as const;

/** Mock scanner data */
export const MOCK_SCANNER = {
  name: 'Ingenia 3.0T',
  stationName: 'MR-SCAN-01',
  coil: '32ch Head Coil',
  softwareVersion: 'R5.7.1.0',
} as const;

/** Mock exam data */
export const MOCK_EXAM = {
  id: 'EX-2024-0892',
  accessionNumber: 'ACC-00001247',
  referringPhysician: 'Dr. Smith',
  indication: 'Headache, r/o intracranial pathology',
} as const;
