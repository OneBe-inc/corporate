# Monthly service landing page

The `/services/monthly/` route renders `src/monthly/template.mjs` as a complete document. Other routes keep the corporate layout. Shared corporate CSS, intro and analytics are intentionally not injected into this route, preventing style collisions and duplicate analytics.

Edit content in `src/monthly/data.mjs`, styles and behavior in that directory. Static media belongs in `public/services/monthly/assets/`. The build copies script/style sources with content-hash query versions. The corporate sitemap, indexing policy, 404, custom domain and publishing workflow remain shared.

Production analytics uses G-21K44SV7K0 only on HTTPS onebe-create.com/services/monthly/, with page_view, sample_view and LINE contact_click events. The supplied restaurant screenshot is onebe-restaurant.png; its source sample ID remains sola for existing analytics continuity.

Validation: npm test; npx playwright test tests/monthly.spec.mjs tests/phone-menu.spec.mjs.
