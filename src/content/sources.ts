/**
 * What the guide rests on. Every entry was checked on 14 November 2026: the title, the author,
 * the year, and that the address loads over https.
 */
export interface Source {
  id: string;
  title: string;
  /** Person or organisation. */
  author: string;
  publisher?: string;
  year?: number;
  /** https only. Omit for a printed book with no stable page. */
  url?: string;
  /** One line: what the guide takes from it. */
  note: string;
}

export const sources: readonly Source[] = [
  {
    id: 'icao-doc-9303',
    title: 'Doc 9303: Machine Readable Travel Documents, eighth edition',
    author: 'International Civil Aviation Organization',
    publisher: 'ICAO',
    year: 2021,
    url: 'https://www.icao.int/publications/doc-series/doc-9303',
    note: 'The parts of a passport and a card, the Chip Inside symbol, the public list of security features, and ICAO’s own history: work begun in 1968, the first edition in 1980, chips in 2006.',
  },
  {
    id: 'iso-iec-7810',
    title: 'ISO/IEC 7810:2019, Identification cards: Physical characteristics',
    author: 'ISO/IEC JTC 1/SC 17',
    publisher: 'International Organization for Standardization',
    year: 2019,
    url: 'https://www.iso.org/standard/70483.html',
    note: 'The standard behind the ID-1 card size and the ID-3 booklet size. The measurements are quoted as Doc 9303 gives them.',
  },
  {
    id: 'prado-glossary',
    title: 'PRADO glossary: technical terms related to security features and to security documents in general',
    author: 'Council of the European Union',
    publisher: 'General Secretariat of the Council',
    url: 'https://www.consilium.europa.eu/prado/en/prado-glossary.html',
    note: 'The public vocabulary for security features, and the level of detail the guide and glossary keep to.',
  },
  {
    id: 'torpey-invention-of-the-passport',
    title: 'The Invention of the Passport: Surveillance, Citizenship and the State, second edition',
    author: 'John C. Torpey',
    publisher: 'Cambridge University Press',
    year: 2018,
    url: 'https://doi.org/10.1017/9781108664271',
    note: 'The nineteenth-century trend toward freedom of movement, the North German Confederation’s law of 1867, and the wartime return of passport controls.',
  },
  {
    id: 'turack-freedom-of-movement',
    title: 'Freedom of Movement and the International Regime of Passports',
    author: 'Daniel C. Turack',
    publisher: 'Osgoode Hall Law Journal, volume 6, number 2',
    year: 1968,
    url: 'https://digitalcommons.osgoode.yorku.ca/ohlj/vol6/iss2/2/',
    note: 'The 1920 Paris conference: its opening on 15 October, the 22 governments represented, and the passport of the international type.',
  },
  {
    id: 'dumitru-passports-or-visas',
    title: 'When world leaders thought you shouldn’t need passports or visas',
    author: 'Speranta Dumitru',
    publisher: 'The Conversation',
    year: 2016,
    url: 'https://theconversation.com/when-world-leaders-thought-you-shouldnt-need-passports-or-visas-64847',
    note: 'Which states made passports compulsory in 1914, the uniform passport agreed in 1920, and the hope of abolition still debated in 1926.',
  },
  {
    id: 'benedictus-brief-history',
    title: 'A brief history of the passport',
    author: 'Leo Benedictus',
    publisher: 'The Guardian',
    year: 2006,
    url: 'https://www.theguardian.com/travel/2006/nov/17/travelnews',
    note: 'The 1414 Act, the disputed origin of the word, the folded British passport of the First World War, and Malaysia as the first state with a chip.',
  },
  {
    id: 'hmpo-historic-passport-information',
    title: 'Historic passport information',
    author: 'HM Passport Office',
    publisher: 'GOV.UK',
    year: 2026,
    url: 'https://www.gov.uk/government/publications/historic-passport-information-caseworker-guidance/historic-passport-information-accessible',
    note: 'Safe conducts in the Act of 1414, the blue booklet of 1920 in the internationally agreed format, and the first British electronic passport in March 2006.',
  },
  {
    id: 'nobel-nansen',
    title: 'Fridtjof Nansen: Speed read',
    author: 'Nobel Prize Outreach',
    publisher: 'NobelPrize.org',
    url: 'https://www.nobelprize.org/prizes/peace/1922/nansen/speedread/',
    note: 'The Nansen passport: approved by the League of Nations in 1922 for refugees left stateless after the Russian revolution.',
  },
  {
    id: 'unhcr-century-of-mobility',
    title: 'A century of mobility: A glimpse into the history of refugee travel documents',
    author: 'Charalampia Armpounioti and Amanda Stovall',
    publisher: 'UNHCR Blog',
    year: 2024,
    url: 'https://www.unhcr.org/blogs/a-century-of-mobility-a-glimpse-into-the-history-of-refugee-travel-documents/',
    note: 'How far the Nansen passport reached: recognised by more than 50 countries and held by about 450,000 refugees.',
  },
  {
    id: 'ec-entry-exit-system',
    title: 'Entry/Exit System (EES)',
    author: 'European Commission, Directorate-General for Migration and Home Affairs',
    publisher: 'European Commission',
    year: 2026,
    url: 'https://home-affairs.ec.europa.eu/policies/schengen/smart-borders/entry-exit-system_en',
    note: 'Why stamps are fading out: the system started in October 2025 and replaced manual stamping from 10 April 2026.',
  },
  {
    id: 'keesing-four-colours',
    title: 'Why do passports only come in four colours?',
    author: 'Keesing Platform',
    publisher: 'Keesing Technologies',
    year: 2019,
    url: 'https://platform.keesingtechnologies.com/why-do-passports-only-come-in-four-colours/',
    note: 'The four loose families of cover colour, and the caveat that no rule governs the choice.',
  },
];
