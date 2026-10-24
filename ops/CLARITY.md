# Corporate heatmaps — 2026-10-24

Owner: OneBe. Production: https://onebe-create.com/ . Clarity project: `yo0ok90i83` (OWN-S01｜OneBe｜コーポレートサイト). Existing project and Strict masking verified in signed-in Clarity settings on 2026-10-24. Before this change Clarity showed installation pending; production loaded only GA4.

## Installation

`public/assets/heatmap.js` loads Clarity directly, once per document, after explicit visitor approval. Existing direct GA4 `G-21K44SV7K0` is unchanged. Do not publish the old staged GTM Clarity tag as well: this rollout does not use GTM.

Choice is stored for 180 days; footer settings reopen the panel. Denial, expired/missing/unavailable storage, non-production hosts, HTTP, `/contact/` and descendants, `/thanks/`, URLs with query strings/fragments, or referrers with query strings prevent loading. Withdrawal reloads the page to unload the recorder; another-tab withdrawal also reloads. Text is masked on the body before loading; Clarity settings are Strict. Consent v2 grants analytics storage and denies ad storage. No identify call or form field values are supplied. Privacy disclosure is part of this release.

The query/referrer exclusion intentionally excludes UTM entries from heatmaps. Clarity is a consented subset; do not compare its session count directly against all GA4 traffic. Future parameter handling requires a separate privacy review rather than silently relaxing these gates.

## How to analyze

Open https://clarity.microsoft.com/projects/view/yo0ok90i83/dashboard → Heatmaps → choose URL, date range and PC/Mobile → Attention. It shows average duration by scroll-position bands, plus share of session length. Use the page screenshot to associate bands with hero, production, works, philosophy, services, process, about, journal and contact CTA. This is visible-page attention, not proof of reading or eye tracking. It does not create named-section GA4 events or a per-section user table. For named-section reporting across layout changes, add an independently defined visibility-time metric later.

Compare Attention with Scroll reach and Click maps. A long dwell can indicate interest or confusion; inspect recordings before deciding. First establish sufficient observations (e.g. an initial 7–14 day review; this is an operating suggestion, not a statistical threshold). Existing historical heatmaps cannot be reconstructed retroactively.

Official references: [Attention maps](https://learn.microsoft.com/en-us/clarity/heatmaps/attention-maps), [CSP](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-csp).

## Validation and rollback

Local: consent/privacy route tests and existing form, GA4, lead and CSP tests; static validation across 27 built pages. PC consent panel visually checked; narrow viewport DOM bounds checked, screenshot tool returned blank (visual mobile check remains pending). No real inquiry was submitted because form behavior is unchanged. Human second reviewer: unconfirmed; AI is the implementer, not a second human reviewer.

Performance scope: existing video-heavy site; only consent UI and async recorder added. Recorder has zero requests before consent and no duplicate start. Local loader budget <8 KiB raw, CSS addition <2 KiB raw. Actual recorder network cost and cold LCP/CLS/TBT median of 3 runs, real-user p75 LCP/INP/CLS: NOT_TESTED. No claim of performance improvement. Existing media/3D lifecycle: N/A to this change.

Rollback: revert this release commit and redeploy. Preserve the Clarity project and existing GA4. Already open pages must reload to unload the recorder. Backend receipt/recording and deployment checks are recorded in the delivery artifact outside the repository.

## 2026-10-24 public-image correction

The first heatmap background masked public images as well as text, making it unlike the published site. Public static image tags and the homepage hero video now carry `data-clarity-unmask="true"`; the hero video has a matching responsive WebP poster. Body text remains masked, project Strict mode and contact/thanks exclusion remain. This exception reveals published imagery and its public alt text only, not form input. Existing masked snapshots cannot be reconstructed; verify using a newly recorded impression and Change screenshot when it becomes available. Mobile production consent panel was subsequently visually verified at 390x844 (see delivery.json), superseding the pending mobile note above.
