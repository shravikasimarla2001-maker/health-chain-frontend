export interface PhcGeo {
  id: string; // Facility UUID
  name: string;
  code: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  facilityType?: 'PHC' | 'CHC' | 'Sub-Centre';
  bedCapacity?: number;
}

export interface DistrictGeo {
  id: string; // District UUID or Code
  name: string;
  code: string;
  stateId: string;
  stateName: string;
  headquarters?: string;
  phcs: PhcGeo[];
}

export interface StateGeo {
  id: string; // State UUID or Code
  name: string;
  code: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East';
  districts: DistrictGeo[];
}

// -------------------------------------------------------------
// LIVE BACKEND IDS MAPPING FOR SEEDED INFRASTRUCTURE
// -------------------------------------------------------------
export const BACKEND_STATE_IDS = {
  JHARKHAND: 'fcb0924b-8d74-469c-b930-5784af9a9cf4',
  MAHARASHTRA: '0cc9fb9d-9d2a-45ef-a403-2807d285ddcb',
};

export const BACKEND_DISTRICT_IDS = {
  RANCHI: '56abec40-f63d-4eaa-82d2-e281b078d78a',
  RAMGARH: 'bedb103d-8ea3-43f4-a435-b2faa28e4071',
  NAGPUR: '05289539-78ad-468d-8c2a-7fd35e6b4d2d',
  PUNE: 'a22124e0-fc72-4b53-8dae-1bbf88398d17',
};

export const BACKEND_PHC_IDS = {
  ORMANJHI: '150038ee-f99b-42ea-acb8-656fe0335361',
  KANKE: 'a1b912f5-0abb-4bf9-b88c-8dd73234e33b',
  GOLA: '46ba4355-9b57-45a4-91c1-a1f8de0f78cb',
  PATRATU: 'a34855ee-eb73-40ff-adba-8f4e990a5b86',
  HINGNA: 'c7fd5081-6dd9-434b-8217-ed4e48f16c2a',
  KAMPTEE: '5682ba02-a5fd-429a-b6e1-f4de6d99c491',
  HAVELI: '012a6d36-b35e-4821-a31b-75a521d0b761',
  MULSHI: 'e282e34a-4e19-4446-b467-f0f70cec5e38',
};

// -------------------------------------------------------------
// COMPLETE HIERARCHICAL GEOGRAPHY DATABASE
// -------------------------------------------------------------
export const ALL_STATES: StateGeo[] = [
  // 1. Jharkhand
  {
    id: BACKEND_STATE_IDS.JHARKHAND,
    name: 'Jharkhand',
    code: 'JH',
    region: 'East',
    districts: [
      {
        id: BACKEND_DISTRICT_IDS.RANCHI,
        name: 'Ranchi',
        code: 'RAN',
        stateId: BACKEND_STATE_IDS.JHARKHAND,
        stateName: 'Jharkhand',
        headquarters: 'Ranchi City',
        phcs: [
          {
            id: BACKEND_PHC_IDS.ORMANJHI,
            name: 'Ormanjhi PHC',
            code: 'ORM_PHC',
            districtId: BACKEND_DISTRICT_IDS.RANCHI,
            districtName: 'Ranchi',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 20,
          },
          {
            id: BACKEND_PHC_IDS.KANKE,
            name: 'Kanke PHC',
            code: 'KAN_PHC',
            districtId: BACKEND_DISTRICT_IDS.RANCHI,
            districtName: 'Ranchi',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 37,
          },
          {
            id: 'phc-ran-namkum-01',
            name: 'Namkum PHC',
            code: 'NAM_PHC',
            districtId: BACKEND_DISTRICT_IDS.RANCHI,
            districtName: 'Ranchi',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 24,
          },
          {
            id: 'phc-ran-ratu-02',
            name: 'Ratu PHC',
            code: 'RAT_PHC',
            districtId: BACKEND_DISTRICT_IDS.RANCHI,
            districtName: 'Ranchi',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
          {
            id: 'phc-ran-mandar-03',
            name: 'Mandar Referral Hospital & PHC',
            code: 'MAN_PHC',
            districtId: BACKEND_DISTRICT_IDS.RANCHI,
            districtName: 'Ranchi',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'CHC',
            bedCapacity: 50,
          },
        ],
      },
      {
        id: BACKEND_DISTRICT_IDS.RAMGARH,
        name: 'Ramgarh',
        code: 'RAM',
        stateId: BACKEND_STATE_IDS.JHARKHAND,
        stateName: 'Jharkhand',
        headquarters: 'Ramgarh Cantonment',
        phcs: [
          {
            id: BACKEND_PHC_IDS.PATRATU,
            name: 'Patratu PHC',
            code: 'PAT_PHC',
            districtId: BACKEND_DISTRICT_IDS.RAMGARH,
            districtName: 'Ramgarh',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 36,
          },
          {
            id: BACKEND_PHC_IDS.GOLA,
            name: 'Gola PHC',
            code: 'GOL_PHC',
            districtId: BACKEND_DISTRICT_IDS.RAMGARH,
            districtName: 'Ramgarh',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 20,
          },
          {
            id: 'phc-ram-mandu-01',
            name: 'Mandu Community Health Centre',
            code: 'MND_CHC',
            districtId: BACKEND_DISTRICT_IDS.RAMGARH,
            districtName: 'Ramgarh',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'CHC',
            bedCapacity: 45,
          },
          {
            id: 'phc-ram-chitarpur-02',
            name: 'Chitarpur Block PHC',
            code: 'CHT_PHC',
            districtId: BACKEND_DISTRICT_IDS.RAMGARH,
            districtName: 'Ramgarh',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 18,
          },
        ],
      },
      {
        id: 'dist-jh-dhanbad-01',
        name: 'Dhanbad',
        code: 'DHN',
        stateId: BACKEND_STATE_IDS.JHARKHAND,
        stateName: 'Jharkhand',
        headquarters: 'Dhanbad City',
        phcs: [
          {
            id: 'phc-dhn-govindpur-01',
            name: 'Govindpur Block PHC',
            code: 'GVD_PHC',
            districtId: 'dist-jh-dhanbad-01',
            districtName: 'Dhanbad',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 25,
          },
          {
            id: 'phc-dhn-jharia-02',
            name: 'Jharia Coalfield PHC',
            code: 'JHR_PHC',
            districtId: 'dist-jh-dhanbad-01',
            districtName: 'Dhanbad',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
          {
            id: 'phc-dhn-nirsa-03',
            name: 'Nirsa PHC',
            code: 'NIR_PHC',
            districtId: 'dist-jh-dhanbad-01',
            districtName: 'Dhanbad',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 20,
          },
        ],
      },
      {
        id: 'dist-jh-bokaro-02',
        name: 'Bokaro',
        code: 'BOK',
        stateId: BACKEND_STATE_IDS.JHARKHAND,
        stateName: 'Jharkhand',
        headquarters: 'Bokaro Steel City',
        phcs: [
          {
            id: 'phc-bok-chas-01',
            name: 'Chas PHC',
            code: 'CHS_PHC',
            districtId: 'dist-jh-bokaro-02',
            districtName: 'Bokaro',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 28,
          },
          {
            id: 'phc-bok-bermo-02',
            name: 'Bermo Sub-Divisional Hospital & PHC',
            code: 'BER_PHC',
            districtId: 'dist-jh-bokaro-02',
            districtName: 'Bokaro',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'CHC',
            bedCapacity: 40,
          },
        ],
      },
      {
        id: 'dist-jh-jamshedpur-03',
        name: 'East Singhbhum (Jamshedpur)',
        code: 'ESN',
        stateId: BACKEND_STATE_IDS.JHARKHAND,
        stateName: 'Jharkhand',
        headquarters: 'Jamshedpur',
        phcs: [
          {
            id: 'phc-esn-potka-01',
            name: 'Potka Tribal PHC',
            code: 'POT_PHC',
            districtId: 'dist-jh-jamshedpur-03',
            districtName: 'East Singhbhum',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 22,
          },
          {
            id: 'phc-esn-ghatsila-02',
            name: 'Ghatsila Rural Hospital PHC',
            code: 'GHT_PHC',
            districtId: 'dist-jh-jamshedpur-03',
            districtName: 'East Singhbhum',
            stateId: BACKEND_STATE_IDS.JHARKHAND,
            stateName: 'Jharkhand',
            facilityType: 'PHC',
            bedCapacity: 35,
          },
        ],
      },
    ],
  },

  // 2. Maharashtra
  {
    id: BACKEND_STATE_IDS.MAHARASHTRA,
    name: 'Maharashtra',
    code: 'MH',
    region: 'West',
    districts: [
      {
        id: BACKEND_DISTRICT_IDS.NAGPUR,
        name: 'Nagpur',
        code: 'NAG',
        stateId: BACKEND_STATE_IDS.MAHARASHTRA,
        stateName: 'Maharashtra',
        headquarters: 'Nagpur',
        phcs: [
          {
            id: BACKEND_PHC_IDS.HINGNA,
            name: 'Hingna PHC',
            code: 'HIN_PHC',
            districtId: BACKEND_DISTRICT_IDS.NAGPUR,
            districtName: 'Nagpur',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 25,
          },
          {
            id: BACKEND_PHC_IDS.KAMPTEE,
            name: 'Kamptee PHC',
            code: 'KAM_PHC',
            districtId: BACKEND_DISTRICT_IDS.NAGPUR,
            districtName: 'Nagpur',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
          {
            id: 'phc-nag-katol-01',
            name: 'Katol Rural Hospital & PHC',
            code: 'KAT_PHC',
            districtId: BACKEND_DISTRICT_IDS.NAGPUR,
            districtName: 'Nagpur',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'CHC',
            bedCapacity: 40,
          },
          {
            id: 'phc-nag-saoner-02',
            name: 'Saoner PHC',
            code: 'SAO_PHC',
            districtId: BACKEND_DISTRICT_IDS.NAGPUR,
            districtName: 'Nagpur',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 20,
          },
        ],
      },
      {
        id: BACKEND_DISTRICT_IDS.PUNE,
        name: 'Pune',
        code: 'PUN',
        stateId: BACKEND_STATE_IDS.MAHARASHTRA,
        stateName: 'Maharashtra',
        headquarters: 'Pune City',
        phcs: [
          {
            id: BACKEND_PHC_IDS.HAVELI,
            name: 'Haveli PHC',
            code: 'HAV_PHC',
            districtId: BACKEND_DISTRICT_IDS.PUNE,
            districtName: 'Pune',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 32,
          },
          {
            id: BACKEND_PHC_IDS.MULSHI,
            name: 'Mulshi PHC',
            code: 'MUL_PHC',
            districtId: BACKEND_DISTRICT_IDS.PUNE,
            districtName: 'Pune',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 26,
          },
          {
            id: 'phc-pun-baramati-01',
            name: 'Baramati Rural Health Centre',
            code: 'BAR_PHC',
            districtId: BACKEND_DISTRICT_IDS.PUNE,
            districtName: 'Pune',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'CHC',
            bedCapacity: 50,
          },
          {
            id: 'phc-pun-shirur-02',
            name: 'Shirur Taluka PHC',
            code: 'SHR_PHC',
            districtId: BACKEND_DISTRICT_IDS.PUNE,
            districtName: 'Pune',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 24,
          },
        ],
      },
      {
        id: 'dist-mh-thane-01',
        name: 'Thane',
        code: 'THA',
        stateId: BACKEND_STATE_IDS.MAHARASHTRA,
        stateName: 'Maharashtra',
        headquarters: 'Thane',
        phcs: [
          {
            id: 'phc-tha-bhiwandi-01',
            name: 'Bhiwandi Tribal PHC',
            code: 'BHW_PHC',
            districtId: 'dist-mh-thane-01',
            districtName: 'Thane',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 25,
          },
          {
            id: 'phc-tha-shahapur-02',
            name: 'Shahapur Rural Hospital & PHC',
            code: 'SHH_PHC',
            districtId: 'dist-mh-thane-01',
            districtName: 'Thane',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'CHC',
            bedCapacity: 45,
          },
        ],
      },
      {
        id: 'dist-mh-aurangabad-02',
        name: 'Chhatrapati Sambhajinagar (Aurangabad)',
        code: 'CSN',
        stateId: BACKEND_STATE_IDS.MAHARASHTRA,
        stateName: 'Maharashtra',
        headquarters: 'Chhatrapati Sambhajinagar',
        phcs: [
          {
            id: 'phc-csn-paithan-01',
            name: 'Paithan PHC',
            code: 'PTH_PHC',
            districtId: 'dist-mh-aurangabad-02',
            districtName: 'Chhatrapati Sambhajinagar',
            stateId: BACKEND_STATE_IDS.MAHARASHTRA,
            stateName: 'Maharashtra',
            facilityType: 'PHC',
            bedCapacity: 28,
          },
        ],
      },
    ],
  },

  // 3. Uttar Pradesh
  {
    id: 'state-up-01',
    name: 'Uttar Pradesh',
    code: 'UP',
    region: 'North',
    districts: [
      {
        id: 'dist-up-lucknow-01',
        name: 'Lucknow',
        code: 'LKO',
        stateId: 'state-up-01',
        stateName: 'Uttar Pradesh',
        headquarters: 'Lucknow',
        phcs: [
          {
            id: 'phc-lko-bakshi-01',
            name: 'Bakshi Ka Talab PHC',
            code: 'BKT_PHC',
            districtId: 'dist-up-lucknow-01',
            districtName: 'Lucknow',
            stateId: 'state-up-01',
            stateName: 'Uttar Pradesh',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
          {
            id: 'phc-lko-malihabad-02',
            name: 'Malihabad Community Health Centre',
            code: 'MLH_CHC',
            districtId: 'dist-up-lucknow-01',
            districtName: 'Lucknow',
            stateId: 'state-up-01',
            stateName: 'Uttar Pradesh',
            facilityType: 'CHC',
            bedCapacity: 45,
          },
          {
            id: 'phc-lko-sarojini-03',
            name: 'Sarojini Nagar PHC',
            code: 'SRJ_PHC',
            districtId: 'dist-up-lucknow-01',
            districtName: 'Lucknow',
            stateId: 'state-up-01',
            stateName: 'Uttar Pradesh',
            facilityType: 'PHC',
            bedCapacity: 25,
          },
        ],
      },
      {
        id: 'dist-up-varanasi-02',
        name: 'Varanasi',
        code: 'VNS',
        stateId: 'state-up-01',
        stateName: 'Uttar Pradesh',
        headquarters: 'Varanasi',
        phcs: [
          {
            id: 'phc-vns-pindra-01',
            name: 'Pindra Block PHC',
            code: 'PND_PHC',
            districtId: 'dist-up-varanasi-02',
            districtName: 'Varanasi',
            stateId: 'state-up-01',
            stateName: 'Uttar Pradesh',
            facilityType: 'PHC',
            bedCapacity: 35,
          },
          {
            id: 'phc-vns-araji-02',
            name: 'Arajiline Community Health Centre',
            code: 'ARJ_CHC',
            districtId: 'dist-up-varanasi-02',
            districtName: 'Varanasi',
            stateId: 'state-up-01',
            stateName: 'Uttar Pradesh',
            facilityType: 'CHC',
            bedCapacity: 50,
          },
        ],
      },
      {
        id: 'dist-up-gorakhpur-03',
        name: 'Gorakhpur',
        code: 'GKP',
        stateId: 'state-up-01',
        stateName: 'Uttar Pradesh',
        headquarters: 'Gorakhpur',
        phcs: [
          {
            id: 'phc-gkp-banshgaon-01',
            name: 'Banshgaon Primary Health Centre',
            code: 'BSG_PHC',
            districtId: 'dist-up-gorakhpur-03',
            districtName: 'Gorakhpur',
            stateId: 'state-up-01',
            stateName: 'Uttar Pradesh',
            facilityType: 'PHC',
            bedCapacity: 28,
          },
        ],
      },
    ],
  },

  // 4. Bihar
  {
    id: 'state-br-01',
    name: 'Bihar',
    code: 'BR',
    region: 'East',
    districts: [
      {
        id: 'dist-br-patna-01',
        name: 'Patna',
        code: 'PAT',
        stateId: 'state-br-01',
        stateName: 'Bihar',
        headquarters: 'Patna',
        phcs: [
          {
            id: 'phc-pat-danapur-01',
            name: 'Danapur Cantonment PHC',
            code: 'DNP_PHC',
            districtId: 'dist-br-patna-01',
            districtName: 'Patna',
            stateId: 'state-br-01',
            stateName: 'Bihar',
            facilityType: 'PHC',
            bedCapacity: 32,
          },
          {
            id: 'phc-pat-phulwari-02',
            name: 'Phulwari Sharif Community Health Centre',
            code: 'PHL_CHC',
            districtId: 'dist-br-patna-01',
            districtName: 'Patna',
            stateId: 'state-br-01',
            stateName: 'Bihar',
            facilityType: 'CHC',
            bedCapacity: 40,
          },
          {
            id: 'phc-pat-bihta-03',
            name: 'Bihta Rural PHC',
            code: 'BHT_PHC',
            districtId: 'dist-br-patna-01',
            districtName: 'Patna',
            stateId: 'state-br-01',
            stateName: 'Bihar',
            facilityType: 'PHC',
            bedCapacity: 24,
          },
        ],
      },
      {
        id: 'dist-br-gaya-02',
        name: 'Gaya',
        code: 'GAY',
        stateId: 'state-br-01',
        stateName: 'Bihar',
        headquarters: 'Gaya',
        phcs: [
          {
            id: 'phc-gay-bodhgaya-01',
            name: 'Bodh Gaya Block PHC',
            code: 'BDG_PHC',
            districtId: 'dist-br-gaya-02',
            districtName: 'Gaya',
            stateId: 'state-br-01',
            stateName: 'Bihar',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
        ],
      },
    ],
  },

  // 5. Karnataka
  {
    id: 'state-ka-01',
    name: 'Karnataka',
    code: 'KA',
    region: 'South',
    districts: [
      {
        id: 'dist-ka-bengaluru-01',
        name: 'Bengaluru Urban',
        code: 'BLR',
        stateId: 'state-ka-01',
        stateName: 'Karnataka',
        headquarters: 'Bengaluru',
        phcs: [
          {
            id: 'phc-blr-yelahanka-01',
            name: 'Yelahanka General PHC',
            code: 'YLH_PHC',
            districtId: 'dist-ka-bengaluru-01',
            districtName: 'Bengaluru Urban',
            stateId: 'state-ka-01',
            stateName: 'Karnataka',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
          {
            id: 'phc-blr-krpuram-02',
            name: 'KR Puram Community Health Centre',
            code: 'KRP_CHC',
            districtId: 'dist-ka-bengaluru-01',
            districtName: 'Bengaluru Urban',
            stateId: 'state-ka-01',
            stateName: 'Karnataka',
            facilityType: 'CHC',
            bedCapacity: 50,
          },
        ],
      },
      {
        id: 'dist-ka-mysuru-02',
        name: 'Mysuru',
        code: 'MYS',
        stateId: 'state-ka-01',
        stateName: 'Karnataka',
        headquarters: 'Mysuru',
        phcs: [
          {
            id: 'phc-mys-nanjangud-01',
            name: 'Nanjangud Taluk PHC',
            code: 'NAN_PHC',
            districtId: 'dist-ka-mysuru-02',
            districtName: 'Mysuru',
            stateId: 'state-ka-01',
            stateName: 'Karnataka',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
        ],
      },
    ],
  },

  // 6. Tamil Nadu
  {
    id: 'state-tn-01',
    name: 'Tamil Nadu',
    code: 'TN',
    region: 'South',
    districts: [
      {
        id: 'dist-tn-chennai-01',
        name: 'Chennai',
        code: 'CHE',
        stateId: 'state-tn-01',
        stateName: 'Tamil Nadu',
        headquarters: 'Chennai',
        phcs: [
          {
            id: 'phc-che-tambaram-01',
            name: 'Tambaram Urban PHC',
            code: 'TMB_UPHC',
            districtId: 'dist-tn-chennai-01',
            districtName: 'Chennai',
            stateId: 'state-tn-01',
            stateName: 'Tamil Nadu',
            facilityType: 'PHC',
            bedCapacity: 35,
          },
          {
            id: 'phc-che-avadi-02',
            name: 'Avadi Community Health Centre',
            code: 'AVD_CHC',
            districtId: 'dist-tn-chennai-01',
            districtName: 'Chennai',
            stateId: 'state-tn-01',
            stateName: 'Tamil Nadu',
            facilityType: 'CHC',
            bedCapacity: 45,
          },
        ],
      },
      {
        id: 'dist-tn-coimbatore-02',
        name: 'Coimbatore',
        code: 'CBE',
        stateId: 'state-tn-01',
        stateName: 'Tamil Nadu',
        headquarters: 'Coimbatore',
        phcs: [
          {
            id: 'phc-cbe-pollachi-01',
            name: 'Pollachi Rural PHC',
            code: 'POL_PHC',
            districtId: 'dist-tn-coimbatore-02',
            districtName: 'Coimbatore',
            stateId: 'state-tn-01',
            stateName: 'Tamil Nadu',
            facilityType: 'PHC',
            bedCapacity: 28,
          },
        ],
      },
    ],
  },

  // 7. Gujarat
  {
    id: 'state-gj-01',
    name: 'Gujarat',
    code: 'GJ',
    region: 'West',
    districts: [
      {
        id: 'dist-gj-ahmedabad-01',
        name: 'Ahmedabad',
        code: 'AHM',
        stateId: 'state-gj-01',
        stateName: 'Gujarat',
        headquarters: 'Ahmedabad',
        phcs: [
          {
            id: 'phc-ahm-sanand-01',
            name: 'Sanand Block PHC',
            code: 'SND_PHC',
            districtId: 'dist-gj-ahmedabad-01',
            districtName: 'Ahmedabad',
            stateId: 'state-gj-01',
            stateName: 'Gujarat',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
          {
            id: 'phc-ahm-dholka-02',
            name: 'Dholka Community Health Centre',
            code: 'DHL_CHC',
            districtId: 'dist-gj-ahmedabad-01',
            districtName: 'Ahmedabad',
            stateId: 'state-gj-01',
            stateName: 'Gujarat',
            facilityType: 'CHC',
            bedCapacity: 40,
          },
        ],
      },
    ],
  },

  // 8. Rajasthan
  {
    id: 'state-rj-01',
    name: 'Rajasthan',
    code: 'RJ',
    region: 'North',
    districts: [
      {
        id: 'dist-rj-jaipur-01',
        name: 'Jaipur',
        code: 'JAI',
        stateId: 'state-rj-01',
        stateName: 'Rajasthan',
        headquarters: 'Jaipur',
        phcs: [
          {
            id: 'phc-jai-amber-01',
            name: 'Amer Block Health Centre',
            code: 'AMR_PHC',
            districtId: 'dist-rj-jaipur-01',
            districtName: 'Jaipur',
            stateId: 'state-rj-01',
            stateName: 'Rajasthan',
            facilityType: 'PHC',
            bedCapacity: 28,
          },
          {
            id: 'phc-jai-sanganer-02',
            name: 'Sanganer Urban PHC',
            code: 'SNG_UPHC',
            districtId: 'dist-rj-jaipur-01',
            districtName: 'Jaipur',
            stateId: 'state-rj-01',
            stateName: 'Rajasthan',
            facilityType: 'PHC',
            bedCapacity: 35,
          },
        ],
      },
    ],
  },

  // 9. West Bengal
  {
    id: 'state-wb-01',
    name: 'West Bengal',
    code: 'WB',
    region: 'East',
    districts: [
      {
        id: 'dist-wb-kolkata-01',
        name: 'Kolkata',
        code: 'KOL',
        stateId: 'state-wb-01',
        stateName: 'West Bengal',
        headquarters: 'Kolkata',
        phcs: [
          {
            id: 'phc-kol-saltlake-01',
            name: 'Bidhannagar Salt Lake Urban PHC',
            code: 'SLK_UPHC',
            districtId: 'dist-wb-kolkata-01',
            districtName: 'Kolkata',
            stateId: 'state-wb-01',
            stateName: 'West Bengal',
            facilityType: 'PHC',
            bedCapacity: 32,
          },
        ],
      },
      {
        id: 'dist-wb-howrah-02',
        name: 'Howrah',
        code: 'HWH',
        stateId: 'state-wb-01',
        stateName: 'West Bengal',
        headquarters: 'Howrah',
        phcs: [
          {
            id: 'phc-hwh-domjur-01',
            name: 'Domjur Rural Hospital & PHC',
            code: 'DMJ_PHC',
            districtId: 'dist-wb-howrah-02',
            districtName: 'Howrah',
            stateId: 'state-wb-01',
            stateName: 'West Bengal',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
        ],
      },
    ],
  },

  // 10. Kerala
  {
    id: 'state-kl-01',
    name: 'Kerala',
    code: 'KL',
    region: 'South',
    districts: [
      {
        id: 'dist-kl-tvm-01',
        name: 'Thiruvananthapuram',
        code: 'TVM',
        stateId: 'state-kl-01',
        stateName: 'Kerala',
        headquarters: 'Thiruvananthapuram',
        phcs: [
          {
            id: 'phc-tvm-kalliyoor-01',
            name: 'Kalliyoor Family Health Centre (FHC)',
            code: 'KLY_FHC',
            districtId: 'dist-kl-tvm-01',
            districtName: 'Thiruvananthapuram',
            stateId: 'state-kl-01',
            stateName: 'Kerala',
            facilityType: 'PHC',
            bedCapacity: 25,
          },
        ],
      },
      {
        id: 'dist-kl-ernakulam-02',
        name: 'Ernakulam (Kochi)',
        code: 'EKM',
        stateId: 'state-kl-01',
        stateName: 'Kerala',
        headquarters: 'Kochi',
        phcs: [
          {
            id: 'phc-ekm-aluva-01',
            name: 'Aluva Taluk PHC',
            code: 'ALV_PHC',
            districtId: 'dist-kl-ernakulam-02',
            districtName: 'Ernakulam',
            stateId: 'state-kl-01',
            stateName: 'Kerala',
            facilityType: 'PHC',
            bedCapacity: 30,
          },
        ],
      },
    ],
  },

  // 11. National Capital Territory of Delhi
  {
    id: 'state-dl-01',
    name: 'NCT of Delhi',
    code: 'DL',
    region: 'North',
    districts: [
      {
        id: 'dist-dl-newdelhi-01',
        name: 'New Delhi',
        code: 'NDL',
        stateId: 'state-dl-01',
        stateName: 'NCT of Delhi',
        headquarters: 'New Delhi',
        phcs: [
          {
            id: 'phc-dl-connaught-01',
            name: 'Connaught Place Central Dispensary',
            code: 'CP_CD',
            districtId: 'dist-dl-newdelhi-01',
            districtName: 'New Delhi',
            stateId: 'state-dl-01',
            stateName: 'NCT of Delhi',
            facilityType: 'PHC',
            bedCapacity: 20,
          },
        ],
      },
      {
        id: 'dist-dl-south-02',
        name: 'South Delhi',
        code: 'SDL',
        stateId: 'state-dl-01',
        stateName: 'NCT of Delhi',
        headquarters: 'Saket',
        phcs: [
          {
            id: 'phc-dl-saket-01',
            name: 'Mehrauli Polyclinic & PHC',
            code: 'MHR_PHC',
            districtId: 'dist-dl-south-02',
            districtName: 'South Delhi',
            stateId: 'state-dl-01',
            stateName: 'NCT of Delhi',
            facilityType: 'PHC',
            bedCapacity: 35,
          },
        ],
      },
    ],
  },
];

// -------------------------------------------------------------
// FLAT LOOKUP CONSTANTS & HELPER FUNCTIONS
// -------------------------------------------------------------

// Flat array of all districts
export const ALL_DISTRICTS: DistrictGeo[] = ALL_STATES.flatMap((state) => state.districts);

// Flat array of all PHCs
export const ALL_PHCS: PhcGeo[] = ALL_DISTRICTS.flatMap((district) => district.phcs);

// Helper: Get districts for a given state
export function getDistrictsForState(stateIdOrCode: string): DistrictGeo[] {
  if (!stateIdOrCode || stateIdOrCode === 'ALL') return ALL_DISTRICTS;
  const state = ALL_STATES.find(
    (s) => s.id === stateIdOrCode || s.code.toUpperCase() === stateIdOrCode.toUpperCase()
  );
  return state ? state.districts : [];
}

// Helper: Get PHCs for a given district
export function getPhcsForDistrict(districtIdOrCode: string): PhcGeo[] {
  if (!districtIdOrCode || districtIdOrCode === 'ALL') return ALL_PHCS;
  const district = ALL_DISTRICTS.find(
    (d) => d.id === districtIdOrCode || d.code.toUpperCase() === districtIdOrCode.toUpperCase()
  );
  return district ? district.phcs : [];
}

// Helper: Get PHCs for a given state
export function getPhcsForState(stateIdOrCode: string): PhcGeo[] {
  if (!stateIdOrCode || stateIdOrCode === 'ALL') return ALL_PHCS;
  const districts = getDistrictsForState(stateIdOrCode);
  return districts.flatMap((d) => d.phcs);
}

// Helper: Find geographic entity by UUID or ID
export function resolveGeoLocation(id?: string | null): {
  type: 'PLATFORM' | 'NATIONAL' | 'STATE' | 'DISTRICT' | 'PHC' | 'UNKNOWN';
  name: string;
  code?: string;
  details?: string;
} {
  if (!id) {
    return { type: 'NATIONAL', name: 'Pan-India Platform Scope', details: 'All States & Facilities' };
  }

  // Check PHCs
  const phc = ALL_PHCS.find((p) => p.id === id || p.code === id);
  if (phc) {
    return {
      type: 'PHC',
      name: phc.name,
      code: phc.code,
      details: `${phc.districtName}, ${phc.stateName}`,
    };
  }

  // Check Districts
  const district = ALL_DISTRICTS.find((d) => d.id === id || d.code === id);
  if (district) {
    return {
      type: 'DISTRICT',
      name: `${district.name} District`,
      code: district.code,
      details: `${district.stateName}`,
    };
  }

  // Check States
  const state = ALL_STATES.find((s) => s.id === id || s.code === id);
  if (state) {
    return {
      type: 'STATE',
      name: `${state.name} State`,
      code: state.code,
      details: `${state.districts.length} Districts`,
    };
  }

  return { type: 'UNKNOWN', name: id, details: 'Custom Scope' };
}
