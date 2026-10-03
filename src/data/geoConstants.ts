export interface GeoConstantItem {
  level: 'STATE' | 'DISTRICT' | 'FACILITY' | 'PHC';
  id: string;
  code: string;
  name: string;
  parent: string;
}

export type GeoItem = GeoConstantItem;

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
// UNIFIED FLAT GEOGRAPHIC DATASET (JSON FORMAT)
// -------------------------------------------------------------
export const GEO_CONSTANTS_JSON: GeoConstantItem[] = [
  {
    "level": "STATE",
    "id": "fcb0924b-8d74-469c-b930-5784af9a9cf4",
    "code": "JH",
    "name": "Jharkhand",
    "parent": ""
  },
  {
    "level": "STATE",
    "id": "0cc9fb9d-9d2a-45ef-a403-2807d285ddcb",
    "code": "MH",
    "name": "Maharashtra",
    "parent": ""
  },
  {
    "level": "FACILITY",
    "id": "c7fd5081-6dd9-434b-8217-ed4e48f16c2a",
    "code": "HIN_PHC",
    "name": "Hingna PHC",
    "parent": "Nagpur"
  },
  {
    "level": "FACILITY",
    "id": "5682ba02-a5fd-429a-b6e1-f4de6d99c491",
    "code": "KAM_PHC",
    "name": "Kamptee PHC",
    "parent": "Nagpur"
  },
  {
    "level": "FACILITY",
    "id": "012a6d36-b35e-4821-a31b-75a521d0b761",
    "code": "HAV_PHC",
    "name": "Haveli PHC",
    "parent": "Pune"
  },
  {
    "level": "FACILITY",
    "id": "e282e34a-4e19-4446-b467-f0f70cec5e38",
    "code": "MUL_PHC",
    "name": "Mulshi PHC",
    "parent": "Pune"
  },
  {
    "level": "FACILITY",
    "id": "46ba4355-9b57-45a4-91c1-a1f8de0f78cb",
    "code": "GOL_PHC",
    "name": "Gola PHC",
    "parent": "Ramgarh"
  },
  {
    "level": "FACILITY",
    "id": "a34855ee-eb73-40ff-adba-8f4e990a5b86",
    "code": "PAT_PHC",
    "name": "Patratu PHC",
    "parent": "Ramgarh"
  },
  {
    "level": "FACILITY",
    "id": "a1b912f5-0abb-4bf9-b88c-8dd73234e33b",
    "code": "KAN_PHC",
    "name": "Kanke PHC",
    "parent": "Ranchi"
  },
  {
    "level": "FACILITY",
    "id": "150038ee-f99b-42ea-acb8-656fe0335361",
    "code": "ORM_PHC",
    "name": "Ormanjhi PHC",
    "parent": "Ranchi"
  },
  {
    "level": "DISTRICT",
    "id": "bedb103d-8ea3-43f4-a435-b2faa28e4071",
    "code": "RAM",
    "name": "Ramgarh",
    "parent": "Jharkhand"
  },
  {
    "level": "DISTRICT",
    "id": "56abec40-f63d-4eaa-82d2-e281b078d78a",
    "code": "RAN",
    "name": "Ranchi",
    "parent": "Jharkhand"
  },
  {
    "level": "DISTRICT",
    "id": "05289539-78ad-468d-8c2a-7fd35e6b4d2d",
    "code": "NAG",
    "name": "Nagpur",
    "parent": "Maharashtra"
  },
  {
    "level": "DISTRICT",
    "id": "a22124e0-fc72-4b53-8dae-1bbf88398d17",
    "code": "PUN",
    "name": "Pune",
    "parent": "Maharashtra"
  }
];

// State Region Mapping
const STATE_REGION_MAP: Record<string, StateGeo['region']> = {
  Jharkhand: 'East',
  Maharashtra: 'West',
  'Uttar Pradesh': 'North',
  Bihar: 'East',
  Karnataka: 'South',
  'Tamil Nadu': 'South',
  Gujarat: 'West',
  Rajasthan: 'North',
  'West Bengal': 'East',
  Kerala: 'South',
  'NCT of Delhi': 'North',
};

// -------------------------------------------------------------
// DYNAMIC HIERARCHICAL STRUCTURE DERIVED FROM FLAT JSON DATA
// -------------------------------------------------------------
export const ALL_STATES: StateGeo[] = GEO_CONSTANTS_JSON
  .filter((item) => item.level === 'STATE')
  .map((stateItem) => {
    const districtItems = GEO_CONSTANTS_JSON.filter(
      (item) => item.level === 'DISTRICT' && item.parent === stateItem.name
    );

    const districts: DistrictGeo[] = districtItems.map((distItem) => {
      const phcItems = GEO_CONSTANTS_JSON.filter(
        (item) => (item.level === 'FACILITY' || item.level === 'PHC') && item.parent === distItem.name
      );

      const phcs: PhcGeo[] = phcItems.map((phcItem) => ({
        id: phcItem.id,
        name: phcItem.name,
        code: phcItem.code,
        districtId: distItem.id,
        districtName: distItem.name,
        stateId: stateItem.id,
        stateName: stateItem.name,
        facilityType: phcItem.code.includes('CHC') ? 'CHC' : 'PHC',
        bedCapacity: 25,
      }));

      return {
        id: distItem.id,
        name: distItem.name,
        code: distItem.code,
        stateId: stateItem.id,
        stateName: stateItem.name,
        headquarters: distItem.name,
        phcs,
      };
    });

    return {
      id: stateItem.id,
      name: stateItem.name,
      code: stateItem.code,
      region: STATE_REGION_MAP[stateItem.name] || 'Central',
      districts,
    };
  });

// Flat array of all districts
export const ALL_DISTRICTS: DistrictGeo[] = ALL_STATES.flatMap((state) => state.districts);

// Flat array of all PHCs
export const ALL_PHCS: PhcGeo[] = ALL_DISTRICTS.flatMap((district) => district.phcs);

// Helper: Get districts for a given state
export function getDistrictsForState(stateIdOrCode: string): DistrictGeo[] {
  if (!stateIdOrCode || stateIdOrCode === 'ALL') return ALL_DISTRICTS;
  const state = ALL_STATES.find(
    (s) =>
      s.id === stateIdOrCode ||
      s.code.toUpperCase() === stateIdOrCode.toUpperCase() ||
      s.name.toLowerCase() === stateIdOrCode.toLowerCase()
  );
  return state ? state.districts : [];
}

// Helper: Get PHCs for a given district
export function getPhcsForDistrict(districtIdOrCode: string): PhcGeo[] {
  if (!districtIdOrCode || districtIdOrCode === 'ALL') return ALL_PHCS;
  const district = ALL_DISTRICTS.find(
    (d) =>
      d.id === districtIdOrCode ||
      d.code.toUpperCase() === districtIdOrCode.toUpperCase() ||
      d.name.toLowerCase() === districtIdOrCode.toLowerCase()
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

  // Check flat JSON dataset first
  const jsonItem = GEO_CONSTANTS_JSON.find(
    (item) => item.id === id || item.code.toUpperCase() === id.toUpperCase() || item.name.toLowerCase() === id.toLowerCase()
  );
  if (jsonItem) {
    if (jsonItem.level === 'FACILITY' || jsonItem.level === 'PHC') {
      return {
        type: 'PHC',
        name: jsonItem.name,
        code: jsonItem.code,
        details: `District: ${jsonItem.parent}`,
      };
    }
    if (jsonItem.level === 'DISTRICT') {
      return {
        type: 'DISTRICT',
        name: `${jsonItem.name} District`,
        code: jsonItem.code,
        details: `State: ${jsonItem.parent}`,
      };
    }
    if (jsonItem.level === 'STATE') {
      return {
        type: 'STATE',
        name: `${jsonItem.name} State`,
        code: jsonItem.code,
        details: 'State Scope',
      };
    }
  }

  // Check PHCs
  const phc = ALL_PHCS.find(
    (p) => p.id === id || p.code.toUpperCase() === id.toUpperCase() || p.name.toLowerCase() === id.toLowerCase()
  );
  if (phc) {
    return {
      type: 'PHC',
      name: phc.name,
      code: phc.code,
      details: `${phc.districtName}, ${phc.stateName}`,
    };
  }

  // Check Districts
  const district = ALL_DISTRICTS.find(
    (d) => d.id === id || d.code.toUpperCase() === id.toUpperCase() || d.name.toLowerCase() === id.toLowerCase()
  );
  if (district) {
    return {
      type: 'DISTRICT',
      name: `${district.name} District`,
      code: district.code,
      details: `${district.stateName}`,
    };
  }

  // Check States
  const state = ALL_STATES.find(
    (s) => s.id === id || s.code.toUpperCase() === id.toUpperCase() || s.name.toLowerCase() === id.toLowerCase()
  );
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

// Helper: Resolve active State for logged-in user or scope
export function resolveUserState(user?: {
  scope_level?: string;
  scope_id?: string | null;
  email?: string;
  full_name?: string;
} | null): StateGeo {
  if (user?.scope_id) {
    // 1. Check direct State
    const byId = ALL_STATES.find(
      (s) =>
        s.id === user.scope_id ||
        s.code.toUpperCase() === user.scope_id?.toUpperCase() ||
        s.name.toLowerCase() === user.scope_id?.toLowerCase()
    );
    if (byId) return byId;

    // 2. Check if scope_id is a District
    const distMatch = ALL_DISTRICTS.find(
      (d) =>
        d.id === user.scope_id ||
        d.code.toUpperCase() === user.scope_id?.toUpperCase() ||
        d.name.toLowerCase() === user.scope_id?.toLowerCase()
    );
    if (distMatch) {
      const stateOfDist = ALL_STATES.find((s) => s.id === distMatch.stateId || s.name === distMatch.stateName);
      if (stateOfDist) return stateOfDist;
    }

    // 3. Check if scope_id is a PHC
    const phcMatch = ALL_PHCS.find(
      (p) =>
        p.id === user.scope_id ||
        p.code.toUpperCase() === user.scope_id?.toUpperCase() ||
        p.name.toLowerCase() === user.scope_id?.toLowerCase()
    );
    if (phcMatch) {
      const stateOfPhc = ALL_STATES.find((s) => s.id === phcMatch.stateId || s.name === phcMatch.stateName);
      if (stateOfPhc) return stateOfPhc;
    }
  }

  const email = (user?.email || '').toLowerCase();
  const name = (user?.full_name || '').toLowerCase();

  if (email.includes('.mh') || name.includes('maharashtra')) {
    const mh = ALL_STATES.find((s) => s.code === 'MH');
    if (mh) return mh;
  }

  // Default to Jharkhand (primary state in geoConstants)
  return ALL_STATES.find((s) => s.code === 'JH') || ALL_STATES[0];
}

// Helper: Resolve active District for logged-in user or scope
export function resolveUserDistrict(user?: {
  scope_level?: string;
  scope_id?: string | null;
  email?: string;
  full_name?: string;
} | null): DistrictGeo {
  if (user?.scope_id) {
    // 1. Check direct District
    const byId = ALL_DISTRICTS.find(
      (d) =>
        d.id === user.scope_id ||
        d.code.toUpperCase() === user.scope_id?.toUpperCase() ||
        d.name.toLowerCase() === user.scope_id?.toLowerCase()
    );
    if (byId) return byId;

    // 2. Check if scope_id is a PHC
    const phcMatch = ALL_PHCS.find(
      (p) =>
        p.id === user.scope_id ||
        p.code.toUpperCase() === user.scope_id?.toUpperCase() ||
        p.name.toLowerCase() === user.scope_id?.toLowerCase()
    );
    if (phcMatch) {
      const distOfPhc = ALL_DISTRICTS.find((d) => d.id === phcMatch.districtId || d.name === phcMatch.districtName);
      if (distOfPhc) return distOfPhc;
    }
  }

  const email = (user?.email || '').toLowerCase();
  const name = (user?.full_name || '').toLowerCase();

  if (email.includes('.ram') || name.includes('ramgarh')) {
    const ram = ALL_DISTRICTS.find((d) => d.code === 'RAM');
    if (ram) return ram;
  }
  if (email.includes('.nag') || name.includes('nagpur')) {
    const nag = ALL_DISTRICTS.find((d) => d.code === 'NAG');
    if (nag) return nag;
  }
  if (email.includes('.pun') || name.includes('pune')) {
    const pun = ALL_DISTRICTS.find((d) => d.code === 'PUN');
    if (pun) return pun;
  }
  if (email.includes('.ran') || name.includes('ranchi')) {
    const ran = ALL_DISTRICTS.find((d) => d.code === 'RAN');
    if (ran) return ran;
  }

  // Default to Ranchi (primary district in geoConstants)
  return ALL_DISTRICTS.find((d) => d.code === 'RAN') || ALL_DISTRICTS[0];
}

// Helper: Resolve active PHC for logged-in user or scope
export function resolveUserPhc(user?: {
  scope_level?: string;
  scope_id?: string | null;
  email?: string;
  full_name?: string;
} | null): PhcGeo {
  if (user?.scope_id) {
    const byId = ALL_PHCS.find(
      (p) =>
        p.id === user.scope_id ||
        p.code.toUpperCase() === user.scope_id?.toUpperCase() ||
        p.name.toLowerCase() === user.scope_id?.toLowerCase()
    );
    if (byId) return byId;
  }

  const email = (user?.email || '').toLowerCase();
  const name = (user?.full_name || '').toLowerCase();

  if (email.includes('.kan') || name.includes('kanke')) {
    const kan = ALL_PHCS.find((p) => p.code === 'KAN_PHC');
    if (kan) return kan;
  }
  if (email.includes('.gol') || name.includes('gola')) {
    const gol = ALL_PHCS.find((p) => p.code === 'GOL_PHC');
    if (gol) return gol;
  }
  if (email.includes('.pat') || name.includes('patratu')) {
    const pat = ALL_PHCS.find((p) => p.code === 'PAT_PHC');
    if (pat) return pat;
  }
  if (email.includes('.hin') || name.includes('hingna')) {
    const hin = ALL_PHCS.find((p) => p.code === 'HIN_PHC');
    if (hin) return hin;
  }
  if (email.includes('.kam') || name.includes('kamptee')) {
    const kam = ALL_PHCS.find((p) => p.code === 'KAM_PHC');
    if (kam) return kam;
  }
  if (email.includes('.hav') || name.includes('haveli')) {
    const hav = ALL_PHCS.find((p) => p.code === 'HAV_PHC');
    if (hav) return hav;
  }
  if (email.includes('.mul') || name.includes('mulshi')) {
    const mul = ALL_PHCS.find((p) => p.code === 'MUL_PHC');
    if (mul) return mul;
  }

  // Default to Ormanjhi PHC (primary PHC in geoConstants)
  return ALL_PHCS.find((p) => p.code === 'ORM_PHC') || ALL_PHCS[0];
}

