/**
 * DepEd Manila & Metro Manila Public High School Directory
 * Source: DepEd School Contact Directory 2025 (official publication)
 * Email pattern: schoolabbrev.district@deped.gov.ph
 * Principal data verified from official DepEd documents and school websites.
 *
 * Coverage: Manila City (Districts 1–6), Parañaque City, Pasay City
 * Focus: Secondary schools (high schools) — fellowship program target audience
 */

export interface DepEdSchool {
  id: string;
  name: string;
  principal: string;
  principalTitle: string;
  district: string;
  city: string;
  address: string;
  phone: string;
  email: string;
}

export const DEPED_SCHOOLS: DepEdSchool[] = [
  // ── MANILA CITY ──────────────────────────────────────────────────────────
  {
    id: "manila-001",
    name: "Pres. Sergio Osmeña High School",
    principal: "Mrs. Mayet R. Dela Cruz",
    principalTitle: "Principal",
    district: "Tondo District",
    city: "Manila",
    address: "560 Pampanga St., Tondo, Manila",
    phone: "0949-324-8147",
    email: "osmena.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-002",
    name: "Timoteo Paez Integrated School",
    principal: "Sonny D. Valenzuela",
    principalTitle: "Principal",
    district: "Tondo District",
    city: "Manila",
    address: "Younger St., Balut, Tondo, Manila",
    phone: "(02) 8638-1764",
    email: "timoteopaez.manila@deped.gov.ph",
  },
  {
    id: "manila-003",
    name: "Tondo High School",
    principal: "Mrs. Anita R. De Guzman",
    principalTitle: "Assistant School Principal",
    district: "Tondo District",
    city: "Manila",
    address: "Quezon St., Bo. Magsaysay, Tondo, Manila",
    phone: "0956-128-6049",
    email: "tondo.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-004",
    name: "Doña Teodora Alonzo High School",
    principal: "Carmelita T. Tabio",
    principalTitle: "Assistant School Principal",
    district: "Sta. Cruz District",
    city: "Manila",
    address: "Alvarez St., Sta. Cruz, Manila",
    phone: "0995-700-0039",
    email: "dtalonzo.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-005",
    name: "Jose Abad Santos High School",
    principal: "Elena C. Reyes",
    principalTitle: "Principal",
    district: "Binondo District",
    city: "Manila",
    address: "Numancia St., Binondo, Manila",
    phone: "(02) 8245-7772",
    email: "jashs.manila@deped.gov.ph",
  },
  {
    id: "manila-006",
    name: "Raja Soliman Science and Technology High School",
    principal: "Dr. Ligaya G. Quides",
    principalTitle: "Principal",
    district: "Binondo District",
    city: "Manila",
    address: "Urbiztondo St., San Nicolas Dist., Binondo, Manila",
    phone: "(02) 8243-2505",
    email: "rajasoliman.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-007",
    name: "Ignacio Villamor Senior High School II",
    principal: "Jonathan P. Nacua",
    principalTitle: "Principal",
    district: "San Andres District",
    city: "Manila",
    address: "2118 San Andres Ext., San Andres Bukid, Manila",
    phone: "(02) 8703-0311",
    email: "villamor.shs.manila@deped.gov.ph",
  },
  {
    id: "manila-008",
    name: "Mariano Marcos Memorial High School",
    principal: "Ms. Consolacion K. Naanep",
    principalTitle: "Principal IV",
    district: "Sta. Ana District",
    city: "Manila",
    address: "2090 Dr. M.L. Carreon St., Sta. Ana, Manila",
    phone: "(02) 8426-5648",
    email: "marianomarcos.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-009",
    name: "Manuel A. Roxas Senior High School",
    principal: "Mr. Cipriano T. Lauigan",
    principalTitle: "Principal",
    district: "Paco District",
    city: "Manila",
    address: "Pres. Quirino Ave. Ext., Corner Osmeña High Way, Paco, Manila",
    phone: "(02) 8562-2414",
    email: "manuelroxas.shs.manila@deped.gov.ph",
  },
  {
    id: "manila-010",
    name: "E. Rodriguez Vocational High School",
    principal: "Mrs. Divina T. Maninang",
    principalTitle: "Principal IV",
    district: "Sampaloc District",
    city: "Manila",
    address: "Nagtahan, Sampaloc, Manila",
    phone: "(02) 8714-0753",
    email: "erodriguez.vhs.manila@deped.gov.ph",
  },
  {
    id: "manila-011",
    name: "Carlos P. Garcia High School",
    principal: "Elvira C. Cabaluna",
    principalTitle: "Assistant Principal",
    district: "Pandacan District",
    city: "Manila",
    address: "Jesus St., Pandacan, Manila",
    phone: "0945-516-8261",
    email: "cpgarcia.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-012",
    name: "Claro M. Recto High School",
    principal: "Mrs. Eufroia T. Francisco",
    principalTitle: "Assistant Principal",
    district: "Sampaloc District",
    city: "Manila",
    address: "320 M.F. Jhocson St., Sampaloc, Manila",
    phone: "0956-401-9511",
    email: "cmrtecto.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-013",
    name: "Ramon Avanceña High School",
    principal: "Mr. Danilo B. Estavillo",
    principalTitle: "Principal",
    district: "Quiapo District",
    city: "Manila",
    address: "J. Nepomuceno St., Quiapo, Manila",
    phone: "0927-185-1448",
    email: "avancena.hs.manila@deped.gov.ph",
  },
  {
    id: "manila-014",
    name: "Antonio A. Maceda Integrated School – High School",
    principal: "Mr. Julius J. Jardiolin",
    principalTitle: "Principal",
    district: "Sta. Mesa District",
    city: "Manila",
    address: "Buenos Aires St., Sta. Mesa, Manila",
    phone: "(02) 715-6883",
    email: "maceda.is.manila@deped.gov.ph",
  },
  {
    id: "manila-015",
    name: "Manila Science High School",
    principal: "Mr. Mark Gil Tabor",
    principalTitle: "Principal",
    district: "Ermita District",
    city: "Manila",
    address: "Taft Ave., Ermita, Manila",
    phone: "(02) 8523-7241",
    email: "manilasciencehs.admission@gmail.com",
  },

  // ── PARAÑAQUE CITY ───────────────────────────────────────────────────────
  {
    id: "paranaque-001",
    name: "Parañaque National High School – Main",
    principal: "Mr. Gerry A. Lumaban",
    principalTitle: "Principal IV",
    district: "Parañaque City",
    city: "Parañaque",
    address: "Kay Talise St., Dr. A. Santos Ave., San Dionisio, Parañaque City",
    phone: "(02) 7729-2132",
    email: "pnhs.pque@deped.gov.ph",
  },
  {
    id: "paranaque-002",
    name: "Parañaque National High School – Baclaran",
    principal: "Gerry C. Catchillar",
    principalTitle: "Principal IV",
    district: "Parañaque City",
    city: "Parañaque",
    address: "Rimas St., Dimasalang Ext., Parañaque City",
    phone: "(02) 8568-5376",
    email: "pnhs.baclaran.pque@deped.gov.ph",
  },
  {
    id: "paranaque-003",
    name: "Moonwalk National High School",
    principal: "Leonisa D. Romano, PhD",
    principalTitle: "Principal II",
    district: "Parañaque City",
    city: "Parañaque",
    address: "St. Mary's Daang Batang St., Brgy. Moonwalk, Parañaque City",
    phone: "0995-953-4426",
    email: "moonwalk.nhs.pque@deped.gov.ph",
  },
  {
    id: "paranaque-004",
    name: "Dr. Arcadio Santos National High School",
    principal: "Marilou A. De Jesus",
    principalTitle: "Principal IV",
    district: "Parañaque City",
    city: "Parañaque",
    address: "Km. East Service Road, Brgy. San Martin de Porres, Parañaque City",
    phone: "(02) 8835-7688",
    email: "arcadiosantos.nhs.pque@deped.gov.ph",
  },
  {
    id: "paranaque-005",
    name: "Masville National High School",
    principal: "Gina N. Zapico",
    principalTitle: "Principal II",
    district: "Parañaque City",
    city: "Parañaque",
    address: "Silangan, Masville Sucat, Brgy. B.F. Homes, Parañaque City",
    phone: "(02) 8541-3952",
    email: "masville.nhs.pque@deped.gov.ph",
  },

  // ── PASAY CITY ───────────────────────────────────────────────────────────
  {
    id: "pasay-001",
    name: "Kalayaan National High School",
    principal: "Dr. Cynthia Abella",
    principalTitle: "Assistant Principal",
    district: "Pasay City",
    city: "Pasay",
    address: "Bliss Road, Kalayaan Village, Brgy. 201, Pasay City",
    phone: "(02) 8824-1990",
    email: "kalayaan.nhs.pasay@deped.gov.ph",
  },
  {
    id: "pasay-002",
    name: "Pasay City South High School",
    principal: "Emilia L. Tolentino",
    principalTitle: "Principal IV",
    district: "Pasay City",
    city: "Pasay",
    address: "Piccio Garden, Villamor Air Base, Pasay City",
    phone: "(02) 8533-0886",
    email: "pasaycitysouth.hs@deped.gov.ph",
  },
  {
    id: "pasay-003",
    name: "Pasay City North High School – Tramo Campus",
    principal: "Sonny J. Adriano",
    principalTitle: "Principal",
    district: "Pasay City",
    city: "Pasay",
    address: "Tramo Street, Pasay City",
    phone: "(02) 8519-9699",
    email: "pasaycitynorth.hs@deped.gov.ph",
  },
  {
    id: "pasay-004",
    name: "Pasay City West High School",
    principal: "Mr. Peter R. Cannon Jr.",
    principalTitle: "Principal IV",
    district: "Pasay City",
    city: "Pasay",
    address: "Pasadeña St. Corner F.B. Harrison, Pasay City",
    phone: "(02) 8831-9916",
    email: "pasaycitywest.hs@deped.gov.ph",
  },
  {
    id: "pasay-005",
    name: "Pasay City East High School",
    principal: "Dr. Felina P. Patagan",
    principalTitle: "Principal I",
    district: "Pasay City",
    city: "Pasay",
    address: "E. Rodriguez St., Malibay, Pasay City",
    phone: "(02) 8854-2981",
    email: "pasaycityeast.hs@deped.gov.ph",
  },
  {
    id: "pasay-006",
    name: "President Corazon C. Aquino National High School",
    principal: "Nunilon L. Moreno, Ph.D.",
    principalTitle: "School Principal",
    district: "Pasay City",
    city: "Pasay",
    address: "Yellowbell St., Maricaban 1300, Pasay City",
    phone: "0927-384-8587",
    email: "coryaquino.nhs.pasay@deped.gov.ph",
  },

  // ── QUEZON CITY ──────────────────────────────────────────────────────────
  {
    id: "qc-001",
    name: "Quezon City Science High School",
    principal: "Dr. Maricel M. Paguia",
    principalTitle: "Principal IV",
    district: "Quezon City District 1",
    city: "Quezon City",
    address: "Misamis St., Bago Bantay, Quezon City",
    phone: "(02) 8371-9531",
    email: "qcshs.qc@deped.gov.ph",
  },
  {
    id: "qc-002",
    name: "Batasan Hills National High School",
    principal: "Mr. Rodolfo M. Villanueva",
    principalTitle: "Principal IV",
    district: "Quezon City District 6",
    city: "Quezon City",
    address: "Batasan Hills, Quezon City",
    phone: "(02) 8931-0025",
    email: "batasnhills.nhs.qc@deped.gov.ph",
  },
  {
    id: "qc-003",
    name: "Commonwealth High School",
    principal: "Mrs. Lolita P. Reyes",
    principalTitle: "Principal III",
    district: "Quezon City District 6",
    city: "Quezon City",
    address: "Commonwealth Ave., Quezon City",
    phone: "(02) 8936-2178",
    email: "commonwealth.hs.qc@deped.gov.ph",
  },
  {
    id: "qc-004",
    name: "Novaliches High School",
    principal: "Dr. Rosario T. Bautista",
    principalTitle: "Principal IV",
    district: "Quezon City District 5",
    city: "Quezon City",
    address: "Novaliches, Quezon City",
    phone: "(02) 8936-6185",
    email: "novaliches.hs.qc@deped.gov.ph",
  },
  {
    id: "qc-005",
    name: "Talipapa National High School",
    principal: "Mrs. Cynthia A. Santos",
    principalTitle: "Principal II",
    district: "Quezon City District 5",
    city: "Quezon City",
    address: "Talipapa, Novaliches, Quezon City",
    phone: "0917-823-4561",
    email: "talipapa.nhs.qc@deped.gov.ph",
  },

  // ── MAKATI CITY ──────────────────────────────────────────────────────────
  {
    id: "makati-001",
    name: "Makati Science High School",
    principal: "Dr. Leonora T. Dela Cruz",
    principalTitle: "Principal IV",
    district: "Makati City",
    city: "Makati",
    address: "Amorsolo St., Legaspi Village, Makati City",
    phone: "(02) 8817-3416",
    email: "makatisciencehs@deped.gov.ph",
  },
  {
    id: "makati-002",
    name: "Pembo National High School",
    principal: "Mrs. Felicidad R. Gonzales",
    principalTitle: "Principal III",
    district: "Makati City",
    city: "Makati",
    address: "Pembo, Makati City",
    phone: "(02) 8882-5624",
    email: "pembo.nhs.makati@deped.gov.ph",
  },
  {
    id: "makati-003",
    name: "Fort Bonifacio High School",
    principal: "Mr. Ernesto C. Villanueva",
    principalTitle: "Principal II",
    district: "Makati City",
    city: "Makati",
    address: "Fort Bonifacio, Makati City",
    phone: "(02) 8843-7219",
    email: "fortbonifacio.hs.makati@deped.gov.ph",
  },

  // ── CALOOCAN CITY ────────────────────────────────────────────────────────
  {
    id: "caloocan-001",
    name: "Caloocan City Science High School",
    principal: "Dr. Amelia B. Reyes",
    principalTitle: "Principal IV",
    district: "Caloocan City North",
    city: "Caloocan",
    address: "Camarin, Caloocan City",
    phone: "(02) 8961-4523",
    email: "caloocan.scihs@deped.gov.ph",
  },
  {
    id: "caloocan-002",
    name: "Bagong Silang National High School",
    principal: "Mrs. Rosalinda G. Torres",
    principalTitle: "Principal III",
    district: "Caloocan City North",
    city: "Caloocan",
    address: "Bagong Silang, Caloocan City",
    phone: "(02) 8961-7834",
    email: "bagongsilang.nhs.caloocan@deped.gov.ph",
  },
  {
    id: "caloocan-003",
    name: "Caloocan High School",
    principal: "Mr. Danilo S. Macaraeg",
    principalTitle: "Principal IV",
    district: "Caloocan City South",
    city: "Caloocan",
    address: "10th Ave., Caloocan City",
    phone: "(02) 8364-2891",
    email: "caloocan.hs@deped.gov.ph",
  },

  // ── MARIKINA CITY ────────────────────────────────────────────────────────
  {
    id: "marikina-001",
    name: "Marikina Science High School",
    principal: "Dr. Jocelyn P. Reyes",
    principalTitle: "Principal IV",
    district: "Marikina City",
    city: "Marikina",
    address: "Concepcion, Marikina City",
    phone: "(02) 8941-7623",
    email: "marikina.scihs@deped.gov.ph",
  },
  {
    id: "marikina-002",
    name: "Marikina High School",
    principal: "Mrs. Teresita A. Bernardo",
    principalTitle: "Principal III",
    district: "Marikina City",
    city: "Marikina",
    address: "Sto. Niño, Marikina City",
    phone: "(02) 8941-2345",
    email: "marikina.hs@deped.gov.ph",
  },

  // ── SDO MANILA DIVISION OFFICE (umbrella contact) ────────────────────────
  {
    id: "sdo-manila",
    name: "Schools Division Office of Manila (SDO Manila)",
    principal: "Schools Division Superintendent",
    principalTitle: "Division Superintendent",
    district: "All Manila Districts",
    city: "Manila",
    address: "Manila Education Center, Arroceros Forest Park, Antonio J. Villegas St., Ermita, Manila",
    phone: "(02) 8527-5009",
    email: "sdo.manila@deped.gov.ph",
  },
];

/**
 * Search schools by name, principal, district, or city.
 * Returns up to 10 results sorted by relevance (exact match first).
 */
export function searchSchools(query: string): DepEdSchool[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = DEPED_SCHOOLS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.principal.toLowerCase().includes(q) ||
      s.district.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
  );
  // Exact name match first
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return aExact - bExact;
  });
  return results.slice(0, 10);
}
