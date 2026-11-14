/**
 * The real world, as Passport needs to know it: the names and codes of real countries, so that
 * presets stay clear of them and the tool can decline to print one as an issuing state.
 *
 * A snapshot, made on 2026-11-14 by tools/make-realworld.mjs. Don't edit it by hand: change the
 * script and run it again. Names are from Unicode CLDR 46.0 with everyday and former names
 * added; codes are ISO 3166-1's, plus the extra codes real travel documents carry.
 */
export const SNAPSHOT_DATE = '2026-11-14';

/** Country and territory names, as written. Compared after normalising (see fiction.ts). */
export const countryNames: readonly string[] = [
  "Abkhazia", "Abyssinia", "Afghanistan", "Åland Islands", "Albania", "Algeria",
  "America", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica",
  "Antigua & Barbuda", "Antigua and Barbuda", "Argentina", "Argentine Republic", "Armenia", "Aruba",
  "Australia", "Austria", "Austria-Hungary", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgie", "Belgique", "Belgium",
  "Belize", "Benin", "Bermuda", "Bharat", "Bhutan", "Bolivia",
  "Bosnia", "Bosnia & Herzegovina", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brasil",
  "Brazil", "Britain", "British Indian Ocean Territory", "British Virgin Islands", "Brunei", "Brunei Darussalam",
  "Bulgaria", "Bulgariya", "Burkina Faso", "Burma", "Burundi", "Cabo Verde",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Caribbean Netherlands", "Cayman Islands",
  "Central African Republic", "Cesko", "Ceylon", "Chad", "Chile", "China",
  "Christmas Island", "Cocos", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo",
  "Congo - Brazzaville", "Congo - Kinshasa", "Congo-Brazzaville", "Congo-Kinshasa", "Cook Islands", "Costa Rica",
  "Cote d'Ivoire", "Côte d’Ivoire", "Croatia", "Cuba", "Curaçao", "Cyprus",
  "Czech Republic", "Czechia", "Czechoslovakia", "Danmark", "Democratic Republic of the Congo", "Denmark",
  "Deutschland", "Djibouti", "Dominica", "Dominican Republic", "DPRK", "DR Congo",
  "East Germany", "East Timor", "Ecuador", "Eesti", "Egypt", "Eire",
  "El Salvador", "England", "Equatorial Guinea", "Eritrea", "Espana", "Estonia",
  "Eswatini", "Ethiopia", "European Union", "Falkland Islands", "Faroe Islands", "Federal Republic of Germany",
  "Federative Republic of Brazil", "Fiji", "Finland", "France", "French Guiana", "French Polynesia",
  "French Republic", "French Southern Territories", "Gabon", "Gambia", "Georgia", "German Democratic Republic",
  "Germany", "Ghana", "Gibraltar", "Great Britain", "Greece", "Greenland",
  "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Heard & McDonald Islands", "Hellas", "Hellenic Republic",
  "Holland", "Holy See", "Honduras", "Hong Kong", "Hong Kong SAR China", "Hrvatska",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Islands", "Isle of Man", "Israel", "Italia", "Italian Republic",
  "Italy", "Ivory Coast", "Jamaica", "Japan", "Jersey", "Jordan",
  "Kazakhstan", "Keeling", "Kenya", "Kingdom of the Netherlands", "Kiribati", "Korea",
  "Kosovo", "Kuwait", "Kyrgyz Republic", "Kyrgyzstan", "Lao People's Democratic Republic", "Laos",
  "Latvia", "Latvija", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lietuva", "Lithuania", "Luxembourg", "Macao", "Macao SAR China",
  "Macau", "Macedonia", "Madagascar", "Magyarorszag", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania",
  "Mauritius", "Mayotte", "Mexico", "Micronesia", "Misr", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique",
  "Myanmar", "Myanmar (Burma)", "Namibia", "Nauru", "Nederland", "Nepal",
  "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "Nihon", "Nippon", "Niue", "Norfolk Island", "Norge", "North Korea",
  "North Macedonia", "Northern Cyprus", "Northern Ireland", "Northern Mariana Islands", "Norway", "Oman",
  "Oriental Republic of Uruguay", "Osterreich", "Ottoman Empire", "Pakistan", "Palau", "Palestine",
  "Palestinian Territories", "Panama", "Papua New Guinea", "Paraguay", "Persia", "Peru",
  "Philippines", "Pitcairn Islands", "Poland", "Polska", "Portugal", "Portuguese Republic",
  "Prussia", "Puerto Rico", "Qatar", "Réunion", "Rhodesia", "Romania",
  "Rossiya", "Russia", "Russian Federation", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "São Tomé & Príncipe", "Sao Tome and Principe", "Saudi Arabia",
  "Schweiz", "Scotland", "Senegal", "Serbia", "Seychelles", "Shqiperia",
  "Siam", "Sierra Leone", "Singapore", "Sint Maarten", "Slovak Republic", "Slovakia",
  "Slovenia", "Slovensko", "Solomon Islands", "Somalia", "Somaliland", "South Africa",
  "South Georgia & South Sandwich Islands", "South Korea", "South Ossetia", "South Sudan", "Soviet Union", "Spain",
  "Srbija", "Sri Lanka", "St. Barthélemy", "St. Helena", "St. Kitts & Nevis", "St. Lucia",
  "St. Martin", "St. Pierre & Miquelon", "St. Vincent & Grenadines", "Sudan", "Suisse", "Suomi",
  "Suriname", "Svalbard & Jan Mayen", "Sverige", "Svizzera", "Swaziland", "Sweden",
  "Swiss Confederation", "Switzerland", "Syria", "Syrian Arab Republic", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Tibet", "Timor-Leste", "Togo", "Tokelau",
  "Tonga", "Transnistria", "Trinidad & Tobago", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkiye", "Türkiye", "Turkmenistan", "Turks & Caicos Islands", "Tuvalu", "U.S. Outlying Islands",
  "U.S. Virgin Islands", "UAE", "Uganda", "UK", "Ukraina", "Ukraine",
  "Union of Soviet Socialist Republics", "United Arab Emirates", "United Kingdom", "United Kingdom of Great Britain and Northern Ireland", "United Mexican States", "United Nations",
  "United States", "United States of America", "Uruguay", "US", "USA", "USSR",
  "Uzbekistan", "Vanuatu", "Vatican", "Vatican City", "Venezuela", "Viet Nam",
  "Vietnam", "Wales", "Wallis & Futuna", "West Germany", "Western Sahara", "Yemen",
  "Yugoslavia", "Zaire", "Zambia", "Zhongguo", "Zimbabwe",
];

/** ISO 3166-1 two-letter codes. */
export const alpha2: readonly string[] = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
  "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
  "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
  "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
  "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
  "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
];

/** ISO 3166-1 three-letter codes. */
export const alpha3: readonly string[] = [
  "AND", "ARE", "AFG", "ATG", "AIA", "ALB", "ARM", "AGO", "ATA", "ARG", "ASM", "AUT", "AUS", "ABW", "ALA", "AZE",
  "BIH", "BRB", "BGD", "BEL", "BFA", "BGR", "BHR", "BDI", "BEN", "BLM", "BMU", "BRN", "BOL", "BES", "BRA", "BHS",
  "BTN", "BVT", "BWA", "BLR", "BLZ", "CAN", "CCK", "COD", "CAF", "COG", "CHE", "CIV", "COK", "CHL", "CMR", "CHN",
  "COL", "CRI", "CUB", "CPV", "CUW", "CXR", "CYP", "CZE", "DEU", "DJI", "DNK", "DMA", "DOM", "DZA", "ECU", "EST",
  "EGY", "ESH", "ERI", "ESP", "ETH", "FIN", "FJI", "FLK", "FSM", "FRO", "FRA", "GAB", "GBR", "GRD", "GEO", "GUF",
  "GGY", "GHA", "GIB", "GRL", "GMB", "GIN", "GLP", "GNQ", "GRC", "SGS", "GTM", "GUM", "GNB", "GUY", "HKG", "HMD",
  "HND", "HRV", "HTI", "HUN", "IDN", "IRL", "ISR", "IMN", "IND", "IOT", "IRQ", "IRN", "ISL", "ITA", "JEY", "JAM",
  "JOR", "JPN", "KEN", "KGZ", "KHM", "KIR", "COM", "KNA", "PRK", "KOR", "KWT", "CYM", "KAZ", "LAO", "LBN", "LCA",
  "LIE", "LKA", "LBR", "LSO", "LTU", "LUX", "LVA", "LBY", "MAR", "MCO", "MDA", "MNE", "MAF", "MDG", "MHL", "MKD",
  "MLI", "MMR", "MNG", "MAC", "MNP", "MTQ", "MRT", "MSR", "MLT", "MUS", "MDV", "MWI", "MEX", "MYS", "MOZ", "NAM",
  "NCL", "NER", "NFK", "NGA", "NIC", "NLD", "NOR", "NPL", "NRU", "NIU", "NZL", "OMN", "PAN", "PER", "PYF", "PNG",
  "PHL", "PAK", "POL", "SPM", "PCN", "PRI", "PSE", "PRT", "PLW", "PRY", "QAT", "REU", "ROU", "SRB", "RUS", "RWA",
  "SAU", "SLB", "SYC", "SDN", "SWE", "SGP", "SHN", "SVN", "SJM", "SVK", "SLE", "SMR", "SEN", "SOM", "SUR", "SSD",
  "STP", "SLV", "SXM", "SYR", "SWZ", "TCA", "TCD", "ATF", "TGO", "THA", "TJK", "TKL", "TLS", "TKM", "TUN", "TON",
  "TUR", "TTO", "TUV", "TWN", "TZA", "UKR", "UGA", "UMI", "USA", "URY", "UZB", "VAT", "VCT", "VEN", "VGB", "VIR",
  "VNM", "VUT", "WLF", "WSM", "YEM", "MYT", "ZAF", "ZMB", "ZWE",
];

/** Codes outside ISO 3166-1 that real travel documents carry, and the specimen code of the standard itself. */
export const travelCodes: readonly string[] = [
  "D", "GBD", "GBN", "GBO", "GBP", "GBS", "UNO", "UNA", "UNK", "XOM", "XCC", "XPO", "XXA", "XXB", "XXC", "XXX",
  "EUE", "XBA", "XIM", "XCO", "XEC", "XES", "XMP", "XDC", "XK", "XKX", "RKS", "UTO",
];
