// What this tool is called and where it lives. Read at build time only: astro.config.mjs, the
// frontmatter of .astro pages, tests and tools/. Never import this from a Svelte component or a
// <script>: it pulls in the list of every Eurth tool, and browser code must not carry that
// (HANDBOOK.md, Launch). Hand the component what it needs as props instead.
import { defineSite } from '@eurth/style/build';

export const site = defineSite({
  // The subdomain, and the tool's id in @eurth/style's tools.json.
  id: 'passport',
  name: 'Passport',
  url: 'https://passport.eurth.org',
  // "<Name>: free online <thing> maker for worldbuilders"
  title: 'Passport: free online fictional passport maker for worldbuilders',
  description:
    'A free online designer of passports, identity cards and border stamps for nations that don’t exist. For worldbuilders and writers; every page is marked SPECIMEN. No account needed.',
  tagline: 'Passports and ID cards for your nation',
  pages: [
    { href: '/', label: 'Designer' },
    { href: '/templates/', label: 'Templates' },
    { href: '/guide/', label: 'Guide' },
    { href: '/glossary/', label: 'Glossary' },
  ],
  repo: 'https://github.com/eurth-org/eurth-passport',
  ogAlt: 'Passport, by Eurth, at passport.eurth.org: the Eurth yurt beside a burgundy passport cover of the invented Republic of Teland, with a gold star in a ring.',
  llms: 'Passport is for fiction only. Every data page and identity card it draws is overprinted SPECIMEN, portraits are drawings (a visitor’s own photograph is never kept), real countries are turned away, and nothing it makes is machine readable.',
});
