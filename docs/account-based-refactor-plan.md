# Account-Based Refactor Plan

Reviewed on March 23, 2026.

## Goal

Refactor the finance model from:

- separate `income`, `savings`, and `credit card` balance systems
- one global "available income" pool

to:

- first-class `accounts`
- explicit `income destination accounts`
- explicit `expense source accounts`
- explicit `transfers` between accounts
- credit cards modeled as accounts with card metadata attached

This refactor is intended to support real-world flows such as:

- salary paid into a payroll bank account
- part-time income received directly in cash
- withdrawals from payroll account to cash
- expenses paid from cash, bank, e-wallet, or credit card
- credit card payments made from cash or bank

## Why This Refactor Is Needed

## Current Product Limitation

The current app can answer:

- how much income was recorded
- how much was tagged as coming from a source
- how much is in named savings banks
- how much is owed on tracked credit cards

The current app cannot reliably answer:

- how much is left in a payroll account
- how much cash is currently on hand
- how much was moved from payroll to cash
- how much sits in non-savings asset accounts such as checking or e-wallets

## Root Cause

The current model treats "income left over" as one global balance:

- `total income - income-funded expenses - income-funded card payments`

That works for rough cash-flow tracking, but it does not model where the money actually lives.

## Current Model Pain Points

1. Income has a source but no destination account.
2. Savings is a separate balance system instead of just another account type.
3. Credit card spending and card payments use separate sync logic.
4. Transfers are implicit and special-cased instead of first-class records.
5. Balance logic is spread across frontend code instead of being driven by one clear data model.
6. Existing multi-step writes can partially fail because one user action may create multiple linked records.

## Refactor Principles

1. Every money movement must identify where the money came from and/or where it went.
2. Accounts are the source of truth for balances.
3. Income source remains separate from account location.
4. Savings is not a special ledger type. It is an account type.
5. Credit cards are accounts with liability behavior plus card metadata.
6. Transfers are first-class records, not encoded as special expense categories.
7. Multi-table finance writes should be executed atomically on the database side.
8. Historical data should not be auto-migrated into false precision when the old model lacks enough information.

## Target Product Behavior

## Example Flows

### Income into payroll account

- `Source`: Salary
- `To account`: Payroll Account
- Result: Payroll Account balance increases

### Income received in cash

- `Source`: Part-time
- `To account`: Cash
- Result: Cash balance increases

### Withdrawal from bank to cash

- `From account`: Payroll Account
- `To account`: Cash
- Result: Payroll Account decreases, Cash increases

### Cash expense

- `Category`: Food
- `From account`: Cash
- Result: Cash decreases

### Credit card purchase

- `Category`: Groceries
- `From account`: BPI Visa
- Result: Card account balance becomes more negative

### Credit card payment

- `From account`: Payroll Account
- `To account`: BPI Visa
- Result: Payroll Account decreases, credit card liability decreases

## Target Domain Model

## Core Concepts

### Income Source

Describes where money came from.

Examples:

- Salary
- Part-time
- Freelance
- Bonus
- Gift

### Account

Describes where money currently is, or which liability it belongs to.

Examples:

- Cash
- Payroll Account
- BDO Checking
- CIMB Savings
- GCash
- BPI Visa

### Expense

Consumes money from one account.

### Transfer

Moves money between two accounts.

### Credit Card

Adds statement-cycle metadata to an account of type `credit_card`.

## Account Types

Recommended account types:

- `cash`
- `checking`
- `savings`
- `ewallet`
- `credit_card`
- `other_asset`
- `other_liability`

Recommended account groups:

- `asset`
- `liability`

The account group drives how balances are displayed in the UI.

## Balance Semantics

Use one signed-balance convention for all accounts:

- asset accounts: positive balance means money available
- liability accounts: negative balance means money owed

Examples:

- Cash `7500` means `7500` cash on hand
- Payroll Account `40000` means `40000` in the bank
- BPI Visa `-12000` means `12000` owed on the card

This convention keeps transfer and balance math simple:

- income to account: `+amount`
- expense from account: `-amount`
- transfer from account: `-amount`
- transfer to account: `+amount`
- opening balance or adjustment: signed amount

For credit cards:

- purchase from card account: expense from credit card account, which makes the balance more negative
- payment to card account: transfer to credit card account, which moves the balance toward zero

## Target Schema

## New Table: `accounts`

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `tracker_id uuid not null references public.trackers(id) on delete cascade`
- `name text not null`
- `account_type text not null`
- `account_group text not null check (account_group in ('asset', 'liability'))`
- `institution text not null default ''`
- `currency_code text not null default 'PHP'`
- `is_active boolean not null default true`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`

Suggested constraints:

- unique tracker-scoped normalized account name
- `account_type` check constraint

Recommended `account_type` check:

- `cash`
- `checking`
- `savings`
- `ewallet`
- `credit_card`
- `other_asset`
- `other_liability`

## New Table: `transfers`

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `tracker_id uuid not null references public.trackers(id) on delete cascade`
- `date date not null`
- `from_account_id uuid not null references public.accounts(id) on delete restrict`
- `to_account_id uuid not null references public.accounts(id) on delete restrict`
- `amount numeric not null check (amount > 0)`
- `transfer_type text not null default 'general'`
- `remarks text`
- `source_recurring_rule_id uuid`
- `source_recurring_run_date date`
- `created_by_name text`
- `created_by_user_id uuid references auth.users(id) on delete set null`
- `created_by_email text`
- `created_at timestamptz not null default now()`

Suggested `transfer_type` values:

- `general`
- `cash_withdrawal`
- `savings_transfer`
- `credit_card_payment`

Constraints:

- `from_account_id <> to_account_id`

## New Table: `account_adjustments`

Purpose:

- opening balances during migration
- reconciliation corrections
- rare manual corrections with auditability

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `tracker_id uuid not null references public.trackers(id) on delete cascade`
- `account_id uuid not null references public.accounts(id) on delete restrict`
- `date date not null`
- `amount numeric not null`
- `reason text not null default 'manual_adjustment'`
- `remarks text`
- `created_by_name text`
- `created_by_user_id uuid references auth.users(id) on delete set null`
- `created_by_email text`
- `created_at timestamptz not null default now()`

Suggested `reason` values:

- `opening_balance`
- `manual_adjustment`
- `reconciliation_fix`

## Existing Table Changes: `incomes`

Keep the table, add:

- `to_account_id uuid not null references public.accounts(id) on delete restrict`

Keep:

- `source`
- `date`
- `amount`
- `remarks`
- creator fields
- recurring trace fields

## Existing Table Changes: `expenses`

Refactor fields to:

- remove `payment_source`
- remove `payment_source_bank`
- remove `payment_source_card_id`
- remove `target_savings_bank`
- add `from_account_id uuid not null references public.accounts(id) on delete restrict`
- optionally add `merchant text`

Keep:

- `category`
- `date`
- `amount`
- `remarks`
- creator fields
- recurring trace fields

Important behavior change:

- transfers to savings are no longer stored as `expenses.category = 'Savings'`
- those become rows in `transfers`

## Existing Table Changes: `credit_cards`

Keep the table for metadata, add:

- `account_id uuid not null references public.accounts(id) on delete restrict`

Keep:

- `name`
- `issuer`
- `limit_amount`
- `statement_day`
- `due_day`

Purpose after refactor:

- card metadata only
- balance no longer lives in `credit_card_transactions`

## Existing Table Removal: `savings`

`savings` should be retired after migration.

Its responsibilities move to:

- `accounts`
- `transfers`
- `account_adjustments`

## Existing Table Removal: `credit_card_transactions`

`credit_card_transactions` should be retired after migration.

Its responsibilities move to:

- `expenses` for card charges
- `transfers` for card payments
- `credit_cards` for card metadata

This removes duplicated finance events and keeps each real-world movement stored once.

## Existing Table Refactor: Recurring Transactions

Recommended replacement:

- create a new `recurring_rules` table instead of trying to patch the current shape in place

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `tracker_id uuid not null references public.trackers(id) on delete cascade`
- `rule_type text not null check (rule_type in ('income', 'expense', 'transfer'))`
- `frequency text not null check (frequency in ('weekly', 'monthly'))`
- `interval_count integer not null default 1 check (interval_count > 0)`
- `start_date date not null`
- `next_run_date date not null`
- `end_date date`
- `is_active boolean not null default true`
- `amount numeric not null check (amount > 0)`
- `description text not null default ''`
- `remarks text`
- `income_source text`
- `income_to_account_id uuid references public.accounts(id) on delete set null`
- `expense_category text`
- `expense_from_account_id uuid references public.accounts(id) on delete set null`
- `transfer_from_account_id uuid references public.accounts(id) on delete set null`
- `transfer_to_account_id uuid references public.accounts(id) on delete set null`
- `created_at timestamptz not null default now()`

This removes current special cases such as:

- `saving`
- `credit_card_charge`

because they become standard transfer or expense rules.

## Derived Views

## `account_balances_view`

Create a SQL view that returns each account with:

- `current_balance`
- `available_to_spend`
- `display_balance`

For liability accounts:

- `display_balance` should usually be shown as absolute amount owed

## `account_activity_view`

Create a unified read-only view that unions:

- incomes
- expenses
- transfers
- account adjustments

This view should power:

- account ledgers
- dashboard recent activity
- cross-account audit screens

## Write Path Design

## Problem to Solve

The current frontend sometimes performs multi-step writes:

- insert expense
- maybe insert linked savings row
- maybe insert linked credit card transaction row

That is fragile because partial failure can leave the data in an inconsistent state.

## Recommended Write Strategy

Use database-side RPC functions for finance writes so each action is atomic.

Recommended functions:

- `record_income(...)`
- `record_expense(...)`
- `record_transfer(...)`
- `record_account_adjustment(...)`
- `delete_income_with_guards(...)`
- `delete_expense_with_guards(...)`
- `delete_transfer_with_guards(...)`
- `delete_account_with_guards(...)`

Each function should:

- validate tracker membership
- validate source and destination accounts belong to the same tracker
- enforce positive amounts
- reject invalid account combinations
- write the row in one transaction
- return the inserted or deleted record

This is the safest way to reduce bug risk in a finance app.

## UI Refactor

## Navigation Changes

Recommended pages after refactor:

- Dashboard
- Expenses
- Income
- Accounts
- Transfers
- Credit Cards
- Recurring
- Reports
- Trackers
- Settings

## Income Page

Current:

- amount
- source
- remarks

New:

- amount
- source
- destination account
- remarks

New summaries:

- income by source
- income by destination account

## Expenses Page

Current:

- category
- funding source type
- maybe savings bank
- maybe credit card

New:

- category
- from account
- amount
- remarks

Behavior:

- if from account is credit card, the expense is a card purchase
- no special "Savings" category for transfers

## Accounts Page

Replaces the current Savings page.

Responsibilities:

- create asset and liability accounts
- show account balances
- show account ledger
- show net asset vs liability totals
- manage opening balances and adjustments

## Transfers Page

New page.

Responsibilities:

- move money between accounts
- record payroll-to-cash withdrawals
- record bank-to-savings transfers
- record card payments as transfers to credit card accounts

## Credit Cards Page

Keeps card metadata management:

- add card
- remove card
- view limit
- view statement day
- view due day

Changes:

- card charges are shown from expenses filtered to card accounts
- card payments are shown from transfers filtered to card accounts
- no standalone card-payment write model

## Dashboard

Replace the current "available income" focus with account-focused summaries:

- total assets
- total liabilities
- net position
- cash on hand
- payroll/checking balances
- recent transfers
- income by source

## Reports

Update reports to support:

- expenses by account
- account balance trend
- transfers by source/destination account
- income by source and destination

## Frontend Implementation Footprint

Expected major file changes:

- [src/types/index.ts](/d:/code/expense-tracker/src/types/index.ts)
- [src/services/supabaseService.ts](/d:/code/expense-tracker/src/services/supabaseService.ts)
- [src/App.vue](/d:/code/expense-tracker/src/App.vue)
- [src/views/IncomePage.vue](/d:/code/expense-tracker/src/views/IncomePage.vue)
- [src/views/ExpensesPage.vue](/d:/code/expense-tracker/src/views/ExpensesPage.vue)
- [src/views/SavingsPage.vue](/d:/code/expense-tracker/src/views/SavingsPage.vue)
- [src/views/CreditCardsPage.vue](/d:/code/expense-tracker/src/views/CreditCardsPage.vue)
- [src/views/RecurringPage.vue](/d:/code/expense-tracker/src/views/RecurringPage.vue)
- [src/views/Dashboard.vue](/d:/code/expense-tracker/src/views/Dashboard.vue)
- [src/components/IncomeForm.vue](/d:/code/expense-tracker/src/components/IncomeForm.vue)
- [src/components/ExpenseForm.vue](/d:/code/expense-tracker/src/components/ExpenseForm.vue)
- current savings components will either be replaced or renamed into account components

Expected new frontend modules:

- `src/views/AccountsPage.vue`
- `src/views/TransfersPage.vue`
- `src/components/AccountForm.vue`
- `src/components/TransferForm.vue`
- `src/lib/accountBalances.ts`
- `src/lib/accountLedger.ts`

## Recommended Migration Strategy

## Key Migration Warning

The current model does not store enough information to reconstruct historical account balances accurately for all trackers.

Example:

- an old income row knows the source, but not whether it went to payroll, cash, e-wallet, or somewhere else

Because of that, a full historical migration would create false confidence and likely introduce bugs.

## Recommended Migration Approach: Carry-Forward Cutover

Use this as the default production migration path.

### Step 1

Deploy new schema alongside the old schema:

- add `accounts`
- add `transfers`
- add `account_adjustments`
- alter `incomes`
- alter `expenses`
- alter `credit_cards`
- add new recurring table or v2 recurring schema

### Step 2

Create new accounts per tracker:

- Payroll Account
- Cash
- Checking accounts
- Savings accounts
- E-wallets
- one account for each tracked credit card

### Step 3

Add opening balance adjustments using real current balances confirmed by the user.

This becomes the new starting point.

### Step 4

Freeze legacy history as archive-only reference:

- old `savings`
- old `credit_card_transactions`
- old income and expense records without account mapping

### Step 5

Start all new writes on the new account-based model.

This is safer than attempting to infer past payroll-to-cash movements that were never recorded explicitly.

## Optional Deep Migration

Only use this if preserving old history as fully live account history is worth the extra risk.

Possible conversions:

- linked savings transfer records with `sourceExpenseId` can be mapped into transfers
- credit card payment rows can be mapped into transfers to card accounts
- savings-funded expenses can be mapped to account-backed expenses

Still unresolved:

- old incomes without destination account
- manual savings entries without clear funding source

Recommendation:

- do not make deep migration the default

## Legacy Data Handling

Recommended options:

1. Keep legacy tables read-only and label them as pre-refactor history.
2. Expose a migration banner explaining that balances are accurate from the cutover date forward.
3. Optionally build an import tool later for manual remapping of old history.

## Rollout Plan

## Phase 0: Prepare Safety Nets

- add new finance-focused test coverage
- add reusable fixtures for income, expense, transfer, and credit card flows
- add SQL migration rehearsal against a staging database

## Phase 1: Schema and Backend Foundation

- add new tables and columns
- add balance/activity SQL views
- add RPC functions for atomic writes
- keep old pages untouched

## Phase 2: Shared Frontend Domain Layer

- add new TypeScript types
- add account balance helpers
- add account and transfer services
- keep old views available during internal verification

## Phase 3: New Pages and Forms

- build Accounts page
- build Transfers page
- update Income page with destination account
- update Expenses page with source account

## Phase 4: Credit Card Refactor

- link each credit card to an account
- switch card charges to expense records from card accounts
- switch card payments to transfer records
- remove old credit card transaction write path

## Phase 5: Recurring Refactor

- migrate recurring rules to account-aware schema
- verify generated records match manual behavior

## Phase 6: Cutover

- enable new write paths
- mark old savings and credit-card transaction pages as archived or remove them
- refresh dashboard and reports to use account-based balances

## Phase 7: Cleanup

- drop unused legacy tables and code paths only after verification and backup

## Testing Plan

## Current Risk

The repo currently has no meaningful automated test suite for finance behavior.

That means this refactor must include tests, not rely only on manual checking.

## Required Automated Tests

### Balance logic tests

1. income to payroll account increases payroll balance
2. income to cash increases cash balance
3. transfer payroll to cash decreases payroll and increases cash
4. expense from cash decreases cash
5. expense from credit card makes card balance more negative
6. transfer to credit card makes card balance less negative
7. liability display formatting shows amount owed correctly

### Write-path tests

1. invalid transfer with same source and destination is rejected
2. cross-tracker account references are rejected
3. deleting an account with dependent rows is blocked or archived safely
4. deleting an expense updates derived balances correctly
5. deleting a transfer updates both accounts correctly

### Recurring tests

1. recurring income posts to destination account
2. recurring expense posts from source account
3. recurring transfer moves between accounts
4. duplicate recurring runs are prevented by idempotency checks

### Migration tests

1. carry-forward migration creates opening balance adjustments correctly
2. legacy archive data remains readable
3. credit cards are linked to newly created card accounts

## Required Manual Verification Scenarios

1. Salary into Payroll Account
2. Part-time income into Cash
3. Withdrawal from Payroll Account to Cash
4. Cash expense
5. Expense from checking account
6. Credit card purchase
7. Credit card payment from payroll account
8. Credit card payment from cash
9. Manual account adjustment
10. Recurring income into payroll account
11. Recurring transfer from payroll to savings
12. Deleting records after they affect balances

## Risk Register

## High Risk

1. Historical migration can create incorrect balances if old income destinations are guessed.
2. Running old and new write paths at the same time can double-count balances.
3. Credit card sign handling can be confusing if UI display rules are inconsistent.

## Medium Risk

1. Recurring logic may generate duplicate records if old and new recurring systems overlap.
2. Reports may silently mix archived legacy rows with new account-based rows.
3. Account deletion rules may frustrate users if archive behavior is unclear.

## Low Risk

1. UI wording changes from "Savings" to "Accounts" may require light onboarding copy.

## Recommended Decisions

1. Use carry-forward migration as the default production path.
2. Keep `income source` as a separate field.
3. Introduce first-class `accounts`.
4. Replace savings transfers with real transfers.
5. Model credit card balances through account-based expenses and transfers.
6. Use database RPC functions for finance writes.
7. Add tests before enabling cutover.

## Definition of Done

The refactor should be considered complete only when:

1. a user can record income to Payroll Account, Cash, or any other account
2. a user can transfer from Payroll Account to Cash
3. a user can see current balance for Payroll Account and Cash separately
4. a user can record expenses from any asset account
5. a user can record credit card purchases and payments without duplicate ledgers
6. dashboard balances no longer depend on the old "available income" pool
7. recurring rules support account-aware income, expense, and transfer flows
8. migration behavior is documented and verified
9. automated tests cover core balance and write flows

## Final Recommendation

For this codebase, the best full refactor is:

- accounts as the balance source of truth
- income with destination accounts
- expenses with source accounts
- transfers as first-class records
- savings retired into account types
- credit cards retained as metadata linked to liability accounts
- atomic database-side write functions
- carry-forward migration for safety

This is a substantial change, but it is the clearest model for the product requirements and the safest long-term foundation for accurate balances.
