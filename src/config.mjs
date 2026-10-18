export const site = {
  name: 'OneBe',
  base: '/',
  origin: 'https://onebe-create.com',
  indexingEnabled: true,
  email: 'info@onebe-create.com',
  formEndpoint: 'https://formsubmit.co/ajax/info@onebe-create.com',
  updated: '2026-10-19',
  profile: 'https://note.com/isseimasuya/n/n8f726bd15c72',
};
export const url = (path = '') => site.base + path.replace(/^\//, '');
export const absolute = (path = '') => site.origin + url(path);

// Public registered-office information: OneBe shared company context, checked 2026-10-17.
export const company = {
  legalName: '株式会社OneBe', representative: '舛谷 一成',
  postalCode: '981-0932', prefecture: '宮城県', city: '仙台市青葉区',
  street: '木町8番10 コーポセナ103号',
};
export const organization = {
  '@context': 'https://schema.org', '@type': 'Organization',
  '@id': absolute() + '#organization', name: company.legalName, legalName: company.legalName, alternateName: 'OneBe',
  url: absolute(), email: site.email, logo: absolute('assets/logo.png'),
  address: {'@type':'PostalAddress', postalCode:company.postalCode, addressRegion:company.prefecture, addressLocality:company.city, streetAddress:company.street, addressCountry:'JP'},
};
