# OneBe Clarity rollout

Prepared 2026-09-26. This is a staged change; it does not itself publish GTM.

- Site: https://onebe-create.com/ including /services/monthly/.
- Keep existing direct GA4 G-21K44SV7K0. Do not add a second Google tag to GTM.
- GTM: GTM-P8T4FL8D, account 6378975178, container 265248289, workspace 2.
- Clarity: yo0ok90i83, OWN-S01｜OneBe｜コーポレートサイト.
- Custom HTML tag: `Clarity | consent only | OWN-S01`; source: `ops/clarity-tag.html`.
- Custom event trigger: `CE | onebe_clarity_allowed`, exact event `onebe_clarity_allowed` (no regex).
- Clarity project masking set to Strict on 2026-09-26; propagation may take up to one hour. Site and tag additionally mask the body before loading Clarity.

## Behavior

GTM loads only on HTTPS onebe-create.com after an explicit heatmap approval. The choice expires after 180 days. Declining, missing consent, blocked storage, previews, /contact/ (including confirmation), and /thanks/ do not load GTM/Clarity. A page URL with a query or fragment, or a referrer with a query, is excluded for the initial rollout. This intentionally loses heatmaps for UTM-tagged entries and some following page views; do not interpret the heatmap sample as total GA traffic.

Text masking is defense in depth, not a guarantee that URLs or all metadata contain no personal data. Never add personal data to page URLs, link targets, tag parameters or Clarity identifiers. This change sets no Clarity user identifiers and grants no advertising storage.

The footer reopens the heatmap setting. Withdrawal saves refusal and reloads the page to unload the recorder; Clarity consent denial by itself still allows limited cookieless collection. GA4 consent/opt-out remains separate from this heatmap choice.

On a confirmed successful form provider response, GA4 receives `generate_lead` once per confirmation-page instance with fixed `form_id=contact`. No draft fields are passed. Failed responses and direct thanks visits do not emit it. Browser/network blocking may prevent delivery; do not treat GA counts as the authoritative inquiry inbox.

## Release and review

1. Second human operator reviews the preview and GTM tag/trigger. Record reviewer and approval in the delivery checklist.
2. Publish only this Clarity tag and event trigger in GTM. Confirm no Google tag has been added.
3. Merge the reviewed site change to main to deploy the Pages workflow, which runs `npm test`.
4. On production, verify no Clarity/GTM request before approval or after refusal, one Clarity script after approval on an eligible page, and no Clarity/GTM on contact/confirmation/thanks.
5. Use GTM Preview/Tag Assistant to verify the custom event. Verify Clarity receives a test session after reporting delay and masked content is unreadable. Record the result; local simulation is not production receipt verification.
6. Check existing GA page_view, LP contact_click/sample_view, and successful-form generate_lead. Mark generate_lead as a GA key event after verifying it. Do not use form-submit button clicks as completed inquiries.
7. Test an actual inquiry and inbox receipt with agreed test data and the receiving operator. Mocked response tests do not establish email delivery.

Rollback: pause the Clarity GTM tag to stop new loads, and revert the site commit if needed. Already open pages require reload to remove the recorder. Preserve the existing GA implementation. Do not delete the Clarity project as a rollback.

## Validation performed before publication

`npm test`: static build checks plus form, GA and heatmap unit tests. Chrome local preview: allow, refuse, reopen settings, persisted choice. Production-only URL gates are simulated in unit tests; preview cannot send live analytics. See delivery record for remaining production checks and human approval.
