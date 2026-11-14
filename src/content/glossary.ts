/**
 * The glossary page: the parts of a passport and a card, security features, stamp and visa
 * words, and a few historical ones. In alphabetical order by term; every `see` id exists.
 */
export interface Term {
  /** Lower-case, hyphenated, unique: the anchor on the glossary page. */
  id: string;
  term: string;
  /** Plain text, one to three sentences. */
  definition: string;
  /** Ids of related terms. */
  see?: string[];
}

export const glossary: readonly Term[] = [
  {
    id: 'biometric-passport',
    term: 'Biometric passport',
    definition:
      'A passport with an electronic chip that stores the holder’s details and portrait, and in some states fingerprints. Also called an electronic passport or e-passport. Malaysia is usually named as the first state to issue one, in 1998.',
    see: ['chip-symbol', 'data-page', 'travel-document'],
  },
  {
    id: 'booklet',
    term: 'Booklet',
    definition:
      'The sewn book of pages that a passport has been since the 1920s, when the League of Nations agreed a common format. Before then a passport was often a single sheet, sometimes folded.',
    see: ['id-3', 'cover', 'visa-page'],
  },
  {
    id: 'chip-symbol',
    term: 'Chip symbol',
    definition:
      'The small mark on the cover of an electronic passport: a rectangle crossed by a bar, with a circle at its centre. ICAO calls it the Chip Inside symbol and allows it only on documents that carry a chip built to its specification.',
    see: ['biometric-passport', 'cover'],
  },
  {
    id: 'cover',
    term: 'Cover',
    definition:
      'The outside of the booklet. It usually carries the name of the issuing state, its emblem and the word for the document, pressed in foil.',
    see: ['emblem', 'foil-stamping', 'chip-symbol'],
  },
  {
    id: 'data-page',
    term: 'Data page',
    definition:
      'The page that identifies the holder: names, nationality, date and place of birth, the document number, the dates of issue and expiry, the portrait and the signature. Also called the biographical data page.',
    see: ['holder', 'portrait', 'machine-readable-zone', 'issuing-authority'],
  },
  {
    id: 'diplomatic-passport',
    term: 'Diplomatic passport',
    definition:
      'A passport issued to diplomats and senior officials travelling on state business, often with a cover of a different colour. The passport marks the holder’s role. Any immunity comes from being accredited to the host state, not from the booklet.',
    see: ['laissez-passer', 'travel-document'],
  },
  {
    id: 'emblem',
    term: 'Emblem',
    definition:
      'The state’s symbol on the cover, most often its coat of arms or a simpler badge taken from it. On a cover it is pressed in a single foil colour, so bold shapes work best.',
    see: ['cover', 'foil-stamping'],
  },
  {
    id: 'endorsement',
    term: 'Endorsement',
    definition:
      'An official note added to a passport after it is issued: a visa, a restriction, a correction or an extension. Visas began as endorsements written or stamped on the passport.',
    see: ['observations-page', 'visa', 'visa-page'],
  },
  {
    id: 'entry-stamp',
    term: 'Entry stamp',
    definition:
      'The inked mark a border officer makes when a traveller arrives. It records the border post and the date, and sometimes the conditions of the stay.',
    see: ['exit-stamp', 'visa', 'visa-page'],
  },
  {
    id: 'exit-stamp',
    term: 'Exit stamp',
    definition:
      'The inked mark made when a traveller leaves, recording the border post and the date. Read with the entry stamp, it shows how long the stay lasted.',
    see: ['entry-stamp', 'exit-visa'],
  },
  {
    id: 'exit-visa',
    term: 'Exit visa',
    definition:
      'Permission to leave a country, required by some states of their own citizens or of foreign residents. In fiction it is a quick way to show a state that keeps a close hold on its people.',
    see: ['visa', 'internal-passport', 'exit-stamp'],
  },
  {
    id: 'foil-stamping',
    term: 'Foil stamping',
    definition:
      'Pressing a thin metallic foil, usually gold or silver, into the cover with a heated die. It is how the lettering and emblem on most passport covers are made.',
    see: ['cover', 'emblem'],
  },
  {
    id: 'ghost-image',
    term: 'Ghost image',
    definition:
      'A second, smaller and fainter copy of the portrait elsewhere on the data page. It is meant to make swapping the photograph hard, because both likenesses would have to match. ICAO also calls it a shadow image.',
    see: ['portrait', 'data-page'],
  },
  {
    id: 'guilloche',
    term: 'Guilloche',
    definition:
      'A pattern of fine, interlaced curving lines forming bands and rosettes, as seen on banknotes. The lines are meant to be too fine and too regular to redraw or copy cleanly.',
    see: ['security-pattern', 'microprint', 'intaglio'],
  },
  {
    id: 'holder',
    term: 'Holder',
    definition:
      'The person a document is issued to and describes. Also called the bearer. In Passport every holder is invented, with a generated name and a drawn portrait.',
    see: ['data-page', 'portrait', 'signature'],
  },
  {
    id: 'holographic-overlay',
    term: 'Holographic overlay',
    definition:
      'A clear film over the data page that carries an image which shifts and flashes as the page moves. It is meant to make it hard to alter the portrait or details without visible damage.',
    see: ['laminate', 'optically-variable-ink'],
  },
  {
    id: 'id-1',
    term: 'ID-1',
    definition:
      'The card size set by the standard ISO/IEC 7810: 85.60 by 53.98 mm, the size of a bank card. Most national identity cards use it.',
    see: ['id-3', 'identity-card'],
  },
  {
    id: 'id-3',
    term: 'ID-3',
    definition:
      'The size set by ISO/IEC 7810 for passport booklets: 125 by 88 mm. It is why passports from different states fit the same pocket and the same reader.',
    see: ['id-1', 'booklet'],
  },
  {
    id: 'identity-card',
    term: 'Identity card',
    definition:
      'A card that proves who the holder is, mostly for use at home. It has a front and a back and no pages, so it cannot take visas or stamps. Some states accept their neighbours’ cards for travel.',
    see: ['id-1', 'travel-document', 'internal-passport'],
  },
  {
    id: 'intaglio',
    term: 'Intaglio',
    definition:
      'Printing from an engraved plate under heavy pressure, which leaves the ink standing slightly proud of the paper. You can feel it with a fingertip, and flat printing has no relief to feel.',
    see: ['guilloche', 'microprint'],
  },
  {
    id: 'internal-passport',
    term: 'Internal passport',
    definition:
      'A document a state requires of its own people for travelling or living inside its borders. Several real empires and republics have used them to tie people to a district.',
    see: ['identity-card', 'exit-visa'],
  },
  {
    id: 'issuing-authority',
    term: 'Issuing authority',
    definition:
      'The office that issued the document and vouches for it: a ministry, a passport office, a consulate. It is named on the data page.',
    see: ['data-page', 'observations-page'],
  },
  {
    id: 'laissez-passer',
    term: 'Laissez-passer',
    definition:
      'French for “let pass”. Today it means a travel document issued by an international organisation to its staff, such as the one the United Nations issues. Historically it was a one-off pass for a single journey.',
    see: ['travel-document', 'safe-conduct', 'diplomatic-passport'],
  },
  {
    id: 'laminate',
    term: 'Laminate',
    definition:
      'A thin clear film sealed over the data page to protect it. It is meant to show visible damage if anyone tries to lift it or change what lies beneath.',
    see: ['holographic-overlay', 'data-page'],
  },
  {
    id: 'machine-readable-zone',
    term: 'Machine-readable zone',
    definition:
      'The lines of plain capitals at the foot of a real data page, which repeat the key details in a form a scanner can read. ICAO began work on it in 1968 to speed up passport control. Passport never draws one: a decorative strip stands in its place.',
    see: ['data-page', 'specimen', 'biometric-passport'],
  },
  {
    id: 'microprint',
    term: 'Microprint',
    definition:
      'Text so small that it looks like a thin line until it is magnified. On a casual copy the letters blur into each other.',
    see: ['guilloche', 'security-pattern'],
  },
  {
    id: 'nansen-passport',
    term: 'Nansen passport',
    definition:
      'An identity and travel document for stateless refugees, approved by the League of Nations in 1922 and named after Fridtjof Nansen, its High Commissioner for Refugees. More than 50 countries came to recognise it.',
    see: ['stateless-person', 'travel-document'],
  },
  {
    id: 'observations-page',
    term: 'Observations page',
    definition:
      'A page set aside for official notes by the issuing authority, such as a restriction, a correction or a change of name.',
    see: ['endorsement', 'issuing-authority'],
  },
  {
    id: 'optically-variable-ink',
    term: 'Optically variable ink',
    definition:
      'Ink that shows one colour head-on and another at a tilt. Also called colour-shifting ink. A copier or camera sees a single angle, so a copy stays one colour.',
    see: ['holographic-overlay', 'uv-feature'],
  },
  {
    id: 'overprint',
    term: 'Overprint',
    definition:
      'Text printed across a finished document to change its status, such as CANCELLED or SPECIMEN. Passport puts a SPECIMEN overprint on every data page and card.',
    see: ['specimen'],
  },
  {
    id: 'perforation',
    term: 'Perforation',
    definition:
      'Rows of tiny holes through the pages, usually spelling the document number and nowadays made by laser. They tie every page to its booklet, so a page taken out or put in is noticed.',
    see: ['booklet', 'visa-page'],
  },
  {
    id: 'portrait',
    term: 'Portrait',
    definition:
      'The picture of the holder on the data page or card, and the largest thing on it, because a face is what an officer compares. In Passport portraits are the tool’s own drawings, and photographs cannot be uploaded.',
    see: ['ghost-image', 'holder', 'data-page'],
  },
  {
    id: 'safe-conduct',
    term: 'Safe conduct',
    definition:
      'A medieval ruler’s written promise that a named traveller could cross his lands unharmed. In England the Safe Conducts Act 1414, under Henry V, made breaking one high treason. It is the passport’s usual ancestor.',
    see: ['laissez-passer', 'travel-document'],
  },
  {
    id: 'security-pattern',
    term: 'Security pattern',
    definition:
      'The fine printed background behind the text and portrait: rosettes, wave lines, lattices and rings. On a real document it makes changes show. In Passport it is decoration only.',
    see: ['guilloche', 'microprint', 'watermark'],
  },
  {
    id: 'signature',
    term: 'Signature',
    definition:
      'The holder’s own mark on the document, the one part not filled in by the state. ICAO’s rules allow a usual mark in its place for holders who cannot write.',
    see: ['holder', 'data-page'],
  },
  {
    id: 'specimen',
    term: 'Specimen',
    definition:
      'A sample document made to show what the real thing looks like, marked so that it cannot be mistaken for one. Everything Passport draws is a specimen, and the word cannot be switched off.',
    see: ['overprint', 'machine-readable-zone'],
  },
  {
    id: 'stateless-person',
    term: 'Stateless person',
    definition:
      'Someone whom no state counts as its national under its law. With no state to issue a passport, a stateless person depends on special documents such as the Nansen passport of the 1920s and its modern successors.',
    see: ['nansen-passport', 'travel-document'],
  },
  {
    id: 'travel-document',
    term: 'Travel document',
    definition:
      'Any official paper accepted for crossing a border. The passport is the best known. Others include identity cards that neighbouring states accept, the laissez-passer, and documents issued to refugees and stateless people.',
    see: ['identity-card', 'laissez-passer', 'nansen-passport', 'biometric-passport'],
  },
  {
    id: 'uv-feature',
    term: 'UV feature',
    definition:
      'Printing or fibres that stay invisible, or change colour, until they are put under an ultraviolet lamp. Security paper also stays dull under the lamp where office paper glows.',
    see: ['optically-variable-ink', 'watermark'],
  },
  {
    id: 'visa',
    term: 'Visa',
    definition:
      'Permission from the state you mean to visit, given before you travel. It says what you may do, for how long and how many times you may enter. Once a stamp, later a sticker, now often an electronic record.',
    see: ['visa-page', 'entry-stamp', 'exit-visa', 'endorsement'],
  },
  {
    id: 'visa-page',
    term: 'Visa page',
    definition:
      'One of the numbered pages in a passport left blank for other states to fill with visas and stamps. A full set of them is a record of a journey.',
    see: ['visa', 'entry-stamp', 'exit-stamp', 'booklet'],
  },
  {
    id: 'watermark',
    term: 'Watermark',
    definition:
      'An image formed in the paper itself while the paper is made, seen when the page is held to the light. It makes ordinary paper a poor substitute for the real thing.',
    see: ['security-pattern', 'uv-feature'],
  },
];
