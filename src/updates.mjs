import {readFileSync} from 'node:fs';
// Last successful RSS snapshot. Updated by scripts/sync-note.mjs.
export const blogPosts = JSON.parse(readFileSync(new URL('./note-posts.json',import.meta.url),'utf8'));
export const newsPosts = [
  {id:'blog-news',date:'2026-09-15',category:'お知らせ',title:'ブログ・ニュース欄を追加しました。',body:['OneBeのコーポレートサイトに、ブログとニュースの欄を追加しました。','ブログでは、代表・舛谷一成がnoteで公開している記事をご紹介します。デザインの仕事に至るまでの背景や、顧問としての考え方をお読みいただけます。','ニュースでは、OneBeからのお知らせを掲載していきます。今後とも株式会社OneBeをよろしくお願いいたします。']},
];
