/**
 * Remakes src/passport/realworld.ts: the snapshot of real country names and codes that Passport
 * keeps its presets clear of, and declines to print as an issuing state.
 *
 *   node tools/make-realworld.mjs
 *
 * Names come from the Unicode CLDR data built into Node (Intl.DisplayNames); the codes are
 * ISO 3166-1's, with the extra three-letter codes that ICAO Doc 9303 lists for travel documents.
 * The other names (short forms, former names, former states) are kept by hand below.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ISO 3166-1 alpha-2 to alpha-3.
const codes = `AD AND AE ARE AF AFG AG ATG AI AIA AL ALB AM ARM AO AGO AQ ATA AR ARG AS ASM AT AUT AU AUS AW ABW AX ALA AZ AZE
BA BIH BB BRB BD BGD BE BEL BF BFA BG BGR BH BHR BI BDI BJ BEN BL BLM BM BMU BN BRN BO BOL BQ BES BR BRA BS BHS BT BTN BV BVT BW BWA BY BLR BZ BLZ
CA CAN CC CCK CD COD CF CAF CG COG CH CHE CI CIV CK COK CL CHL CM CMR CN CHN CO COL CR CRI CU CUB CV CPV CW CUW CX CXR CY CYP CZ CZE
DE DEU DJ DJI DK DNK DM DMA DO DOM DZ DZA
EC ECU EE EST EG EGY EH ESH ER ERI ES ESP ET ETH
FI FIN FJ FJI FK FLK FM FSM FO FRO FR FRA
GA GAB GB GBR GD GRD GE GEO GF GUF GG GGY GH GHA GI GIB GL GRL GM GMB GN GIN GP GLP GQ GNQ GR GRC GS SGS GT GTM GU GUM GW GNB GY GUY
HK HKG HM HMD HN HND HR HRV HT HTI HU HUN
ID IDN IE IRL IL ISR IM IMN IN IND IO IOT IQ IRQ IR IRN IS ISL IT ITA
JE JEY JM JAM JO JOR JP JPN
KE KEN KG KGZ KH KHM KI KIR KM COM KN KNA KP PRK KR KOR KW KWT KY CYM KZ KAZ
LA LAO LB LBN LC LCA LI LIE LK LKA LR LBR LS LSO LT LTU LU LUX LV LVA LY LBY
MA MAR MC MCO MD MDA ME MNE MF MAF MG MDG MH MHL MK MKD ML MLI MM MMR MN MNG MO MAC MP MNP MQ MTQ MR MRT MS MSR MT MLT MU MUS MV MDV MW MWI MX MEX MY MYS MZ MOZ
NA NAM NC NCL NE NER NF NFK NG NGA NI NIC NL NLD NO NOR NP NPL NR NRU NU NIU NZ NZL
OM OMN
PA PAN PE PER PF PYF PG PNG PH PHL PK PAK PL POL PM SPM PN PCN PR PRI PS PSE PT PRT PW PLW PY PRY
QA QAT
RE REU RO ROU RS SRB RU RUS RW RWA
SA SAU SB SLB SC SYC SD SDN SE SWE SG SGP SH SHN SI SVN SJ SJM SK SVK SL SLE SM SMR SN SEN SO SOM SR SUR SS SSD ST STP SV SLV SX SXM SY SYR SZ SWZ
TC TCA TD TCD TF ATF TG TGO TH THA TJ TJK TK TKL TL TLS TM TKM TN TUN TO TON TR TUR TT TTO TV TUV TW TWN TZ TZA
UA UKR UG UGA UM UMI US USA UY URY UZ UZB
VA VAT VC VCT VE VEN VG VGB VI VIR VN VNM VU VUT
WF WLF WS WSM
YE YEM YT MYT
ZA ZAF ZM ZMB ZW ZWE`
  .split(/\s+/)
  .filter(Boolean);

if (codes.length !== 249 * 2) throw new Error(`Expected 249 pairs of codes, found ${codes.length / 2}.`);
const alpha2 = codes.filter((_, i) => i % 2 === 0);
const alpha3 = codes.filter((_, i) => i % 2 === 1);
if (new Set(alpha2).size !== 249 || new Set(alpha3).size !== 249) throw new Error('A code is listed twice.');

// Codes outside ISO 3166-1 that real travel documents carry (ICAO Doc 9303, part 3), plus
// Kosovo's and the code of ICAO's own specimen state, Utopia.
const travelCodes = ['D', 'GBD', 'GBN', 'GBO', 'GBP', 'GBS', 'UNO', 'UNA', 'UNK', 'XOM', 'XCC', 'XPO', 'XXA', 'XXB', 'XXC', 'XXX', 'EUE', 'XBA', 'XIM', 'XCO', 'XEC', 'XES', 'XMP', 'XDC', 'XK', 'XKX', 'RKS', 'UTO'];

// Names CLDR doesn't give as such: everyday short forms, formal names that aren't
// "<form> of <name>", former names and former states.
const otherNames = [
  'America', 'United States of America', 'USA', 'US', 'UK', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland',
  'United Kingdom of Great Britain and Northern Ireland', 'Holland', 'Burma', 'Myanmar', 'Congo', 'DR Congo', 'Democratic Republic of the Congo',
  'Congo-Kinshasa', 'Congo-Brazzaville', 'Ivory Coast', "Cote d'Ivoire", 'Turkey', 'Turkiye', 'Czech Republic', 'Czechia', 'Slovak Republic',
  'Swaziland', 'Eswatini', 'Macedonia', 'North Macedonia', 'Russia', 'Russian Federation', 'Korea', 'South Korea', 'North Korea', 'DPRK',
  'Laos', "Lao People's Democratic Republic", 'Vietnam', 'Viet Nam', 'Syria', 'Syrian Arab Republic', 'Iran', 'Bolivia', 'Venezuela', 'Tanzania',
  'Moldova', 'Brunei', 'Brunei Darussalam', 'Cape Verde', 'Cabo Verde', 'East Timor', 'Timor-Leste', 'Vatican', 'Vatican City', 'Holy See',
  'Palestine', 'Taiwan', 'Kosovo', 'Hong Kong', 'Macau', 'Macao', 'Micronesia', 'Gambia', 'Bahamas', 'Netherlands', 'Philippines', 'Maldives',
  'Comoros', 'Seychelles', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Sao Tome and Principe', 'Trinidad and Tobago',
  'Antigua and Barbuda', 'Bosnia and Herzegovina', 'Bosnia', 'French Republic', 'Hellenic Republic', 'Italian Republic', 'Portuguese Republic',
  'Argentine Republic', 'Dominican Republic', 'Central African Republic', 'Kyrgyz Republic', 'Swiss Confederation', 'United Mexican States',
  'Oriental Republic of Uruguay', 'Federative Republic of Brazil', 'Kingdom of the Netherlands', 'United Arab Emirates', 'UAE',
  'Soviet Union', 'USSR', 'Union of Soviet Socialist Republics', 'Yugoslavia', 'Czechoslovakia', 'East Germany', 'West Germany',
  'German Democratic Republic', 'Federal Republic of Germany', 'Zaire', 'Rhodesia', 'Persia', 'Siam', 'Ceylon', 'Abyssinia', 'Prussia',
  'Ottoman Empire', 'Austria-Hungary', 'Tibet', 'Somaliland', 'Transnistria', 'Abkhazia', 'South Ossetia', 'Northern Cyprus', 'Western Sahara',
  'European Union', 'United Nations',
  // What some countries call themselves, in Latin letters.
  'Deutschland', 'Espana', 'Italia', 'Nederland', 'Belgie', 'Belgique', 'Osterreich', 'Schweiz', 'Suisse', 'Svizzera', 'Polska', 'Sverige',
  'Norge', 'Danmark', 'Suomi', 'Eire', 'Magyarorszag', 'Cesko', 'Slovensko', 'Hrvatska', 'Srbija', 'Ukraina', 'Rossiya', 'Hellas',
  'Nippon', 'Nihon', 'Zhongguo', 'Bharat', 'Brasil', 'Misr', 'Lietuva', 'Latvija', 'Eesti', 'Shqiperia', 'Bulgariya',
];

const long = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
const short = new Intl.DisplayNames(['en'], { type: 'region', style: 'short', fallback: 'none' });
const names = new Set();
for (const code of alpha2) {
  const name = long.of(code);
  if (!name) throw new Error(`Node's CLDR data has no name for ${code}.`);
  for (const one of [name, short.of(code)]) {
    if (!one) continue;
    names.add(one);
    // "Myanmar (Burma)" is also "Myanmar" and "Burma"; "Congo - Kinshasa" is also its two halves.
    for (const part of one.split(/\s*[()]\s*|\s+-\s+/)) if (part.trim().length > 2) names.add(part.trim());
  }
}
for (const name of otherNames) names.add(name);
// The halves of "Congo - Kinshasa" are cities, not countries.
for (const city of ['Kinshasa', 'Brazzaville']) names.delete(city);

const list = (values, perLine) => {
  const lines = [];
  for (let i = 0; i < values.length; i += perLine) lines.push(`  ${values.slice(i, i + perLine).map((v) => JSON.stringify(v)).join(', ')},`);
  return lines.join('\n');
};

const today = new Date().toISOString().slice(0, 10);
const out = `/**
 * The real world, as Passport needs to know it: the names and codes of real countries, so that
 * presets stay clear of them and the tool can decline to print one as an issuing state.
 *
 * A snapshot, made on ${today} by tools/make-realworld.mjs. Don't edit it by hand: change the
 * script and run it again. Names are from Unicode CLDR ${process.versions.cldr} with everyday and former names
 * added; codes are ISO 3166-1's, plus the extra codes real travel documents carry.
 */
export const SNAPSHOT_DATE = '${today}';

/** Country and territory names, as written. Compared after normalising (see fiction.ts). */
export const countryNames: readonly string[] = [
${list([...names].sort((a, b) => a.localeCompare(b, 'en')), 6)}
];

/** ISO 3166-1 two-letter codes. */
export const alpha2: readonly string[] = [
${list(alpha2, 20)}
];

/** ISO 3166-1 three-letter codes. */
export const alpha3: readonly string[] = [
${list(alpha3, 16)}
];

/** Codes outside ISO 3166-1 that real travel documents carry, and the specimen code of the standard itself. */
export const travelCodes: readonly string[] = [
${list(travelCodes, 16)}
];
`;

writeFileSync(fileURLToPath(new URL('../src/passport/realworld.ts', import.meta.url)), out);
console.log(`${names.size} names, ${alpha2.length} two-letter codes, ${alpha3.length} three-letter codes, ${travelCodes.length} travel codes.`);
