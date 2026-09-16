export const site = {
  name: 'OneBe',
  base: '/',
  origin: 'https://onebe-create.com',
  indexingEnabled: false,
  email: 'info@onebe-create.com',
  formEndpoint: 'https://formsubmit.co/ajax/info@onebe-create.com',
  updated: '2026-09-14',
  profile: 'https://note.com/isseimasuya/n/n8f726bd15c72',
};
export const url = (path = '') => site.base + path.replace(/^\//, '');
export const absolute = (path = '') => site.origin + url(path);
