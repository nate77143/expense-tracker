# Billing, Pricing, and Plan Strategy

Reviewed on March 23, 2026.

This document captures the current recommended billing model, pricing, and feature split for the expense tracker so it can be revisited later.

## Recommended Monetization Model

Use a `freemium + Pro trial` model.

Why:
- finance products usually need habit-building and trust before conversion
- users often need time to enter real accounts, income, and expenses before the value is obvious
- a pure trial-only model can feel risky because the workflow stops right when users start getting comfortable

Recommended structure:
1. `Free` plan for ongoing basic use
2. `Pro` plan for advanced features
3. `14-day Pro trial` so users can experience premium value before paying
4. optional `Founding Lifetime` offer for early adopters only

## Recommended Pricing

### Launch Pricing

- `Free`: `$0`
- `Pro Monthly`: `$3.99/month`
- `Pro Yearly`: `$29.99/year`
- `Founding Lifetime`: `$69` one time, limited launch offer

### Alternative Pricing Bands

If lower-friction growth is the priority:
- `$2.99/month`
- `$24.99/year`

If a more premium position is preferred later:
- `$4.99/month`
- `$39.99/year`

## Why This Price Range Fits

The app is strong, but still earlier-stage than major budgeting products.

Comparable products are priced much higher:
- YNAB: `$14.99/month` or `$109/year`
- Monarch Money: `$99.99/year`
- EveryDollar Premium: `$17.99/month` or `$79.99/year`

Recommended pricing should stay well below those products until:
- billing is fully integrated
- the app has stronger polish and onboarding
- export and backup features are live
- the paid feature set has matured

## Plan Table

| Plan | Price | Best for | Main limits |
|---|---:|---|---|
| Free | $0 | Solo users trying the app | 1 tracker, limited accounts, basic reports |
| Pro Monthly | $3.99/month | Users who want flexibility | Full features |
| Pro Yearly | $29.99/year | Best value | Full features |
| Founding Lifetime | $69 one-time | Early supporters | Full features, limited offer |

## Recommended Feature Split

### Free Plan

The free plan should be genuinely useful.

Include:
- `1 tracker`
- up to `5 accounts`
- up to `1 credit card`
- income tracking
- expense tracking
- transfers
- manual adjustments
- basic dashboard
- recent activity
- basic reports:
  - expense by category
  - simple spending trend

Exclude:
- shared trackers / collaborators
- recurring rules
- advanced reports
- exports
- unlimited accounts
- unlimited credit cards

### Pro Plan

The Pro plan should focus on power, automation, analysis, and collaboration.

Include:
- unlimited trackers
- unlimited accounts
- unlimited credit cards
- shared trackers / collaborators
- recurring income rules
- recurring expense rules
- recurring transfer rules
- advanced reports:
  - income by source
  - income by destination account
  - expenses by source account
  - transfer route reporting
  - balance trend
  - period comparison
- future export features
- future premium support / backup features

## Upgrade Triggers

Good moments to show the Pro upgrade flow:
- when a user tries to create a second tracker
- when a user tries to add a sixth account
- when a user tries to add a second credit card
- when a user opens advanced reports
- when a user creates a recurring rule
- when a user invites another member

These are better than random upgrade prompts because they appear exactly when the user feels the value.

## Recommended Trial Structure

- `14-day Pro trial`
- no feature deletion after the trial ends
- keep existing Pro-created data readable
- lock new Pro-only actions after expiry unless the user upgrades

Important principle:
- do not punish users by deleting financial records after a trial
- preserve trust by allowing read access to existing data, even if write access becomes limited

## Recommended Paywall Copy

### Headline

`Upgrade to Pro`

### Subheadline

`Track shared finances, automate recurring entries, and unlock advanced reports.`

### Free Highlights

- `1 tracker`
- `Up to 5 accounts`
- `Basic reports`

### Pro Highlights

- `Unlimited trackers and accounts`
- `Recurring rules`
- `Advanced reports`
- `Shared trackers`
- `Unlimited card tracking`

### Suggested Buttons

- `Start 14-Day Free Trial`
- `Get Pro Yearly`
- `Continue with Free`

## Positioning Recommendation

Do not market the app as just another expense tracker.

Stronger positioning:
- `See where your money really is`
- `Track payroll, cash, savings, e-wallets, and card balances in one place`
- `Great for personal and shared finances`

This matches the app's account-based design and is stronger than generic budgeting language.

## Implementation Notes For Later

When billing work starts, likely areas to add:
- plan table or subscription table in Supabase
- feature flags for plan gating
- trial start and expiry tracking
- frontend paywall and locked-state UI
- usage-limit checks for:
  - trackers
  - accounts
  - credit cards
  - recurring rules
  - collaborators
  - advanced reports

## Recommended Next Billing Work

When returning to this later, a good order is:
1. define plan and subscription schema
2. define feature flags and usage limits
3. add locked-feature UI states
4. add paywall page / modal
5. integrate billing provider
6. add webhook-based subscription sync
7. test downgrade behavior carefully

## Current Recommendation Summary

Use:
- `Free`
- `Pro Monthly: $3.99`
- `Pro Yearly: $29.99`
- `14-day Pro trial`
- optional `Founding Lifetime: $69`

Free should stay useful.
Pro should unlock automation, collaboration, and advanced reporting.
