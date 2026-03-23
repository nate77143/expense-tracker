# Account-Based Refactor Checklist

Reviewed on March 23, 2026.

This checklist turns the refactor plan in [docs/account-based-refactor-plan.md](/d:/code/expense-tracker/docs/account-based-refactor-plan.md) into executable phases.

## Recommended Execution Order

1. Phase 0: Safety and test foundation
2. Phase 1: Schema and backend primitives
3. Phase 2: Shared frontend domain layer
4. Phase 3: Accounts and transfers UI
5. Phase 4: Income and expenses cutover
6. Phase 5: Credit card cutover
7. Phase 6: Recurring cutover
8. Phase 7: Dashboard, reports, and legacy archive handling
9. Phase 8: Production cutover and cleanup

## Phase 0: Safety and Test Foundation

### Planning

- [ ] Confirm the carry-forward migration strategy is the chosen default
- [ ] Confirm old legacy history will be kept as archive-only reference
- [ ] Confirm the first supported account types for launch:
  - `cash`
  - `checking`
  - `savings`
  - `ewallet`
  - `credit_card`
- [ ] Confirm credit cards will remain a metadata table linked to account rows

### Tooling

- [ ] Add a frontend/unit test runner
- [ ] Add a test script to [package.json](/d:/code/expense-tracker/package.json)
- [ ] Add a basic test folder structure
- [ ] Add test fixtures for trackers, accounts, incomes, expenses, transfers, and cards

### Test Coverage To Add First

- [ ] Balance calculation tests for asset accounts
- [ ] Balance calculation tests for liability accounts
- [ ] Transfer logic tests
- [ ] Credit card balance-display tests
- [ ] Guard tests for invalid account combinations

### Done When

- [ ] The repo can run automated finance-domain tests locally
- [ ] Balance helper behavior is covered before production refactor logic depends on it

## Phase 1: Schema and Backend Primitives

### New Database Structures

- [ ] Create `accounts` table
- [ ] Create `transfers` table
- [ ] Create `account_adjustments` table
- [ ] Create `account_balances_view`
- [ ] Create `account_activity_view`

### Existing Database Changes

- [ ] Add `to_account_id` to `incomes`
- [ ] Add `from_account_id` to `expenses`
- [ ] Add `account_id` to `credit_cards`
- [ ] Leave `savings` and `credit_card_transactions` in place for now
- [ ] Leave legacy `payment_source` and savings-link columns in place for now

### RPC / Stored Procedure Layer

- [ ] Add `record_income(...)`
- [ ] Add `record_expense(...)`
- [ ] Add `record_transfer(...)`
- [ ] Add `record_account_adjustment(...)`
- [ ] Add guarded delete procedures as needed

### Backend Rules

- [ ] Enforce tracker ownership for referenced accounts
- [ ] Enforce `from_account_id <> to_account_id` on transfers
- [ ] Enforce positive amounts for incomes, expenses, and transfers
- [ ] Enforce correct account group rules for transfers and card linkage

### RLS and Audit

- [ ] Add RLS policies for `accounts`
- [ ] Add RLS policies for `transfers`
- [ ] Add RLS policies for `account_adjustments`
- [ ] Add audit log triggers or extend existing audit coverage

### Done When

- [ ] A tracker can create accounts
- [ ] A tracker can record income into an account
- [ ] A tracker can record a transfer between accounts
- [ ] A tracker can record an expense from an account
- [ ] Core writes are atomic at the database level

## Phase 2: Shared Frontend Domain Layer

### Types

- [ ] Add `Account` type to [src/types/index.ts](/d:/code/expense-tracker/src/types/index.ts)
- [ ] Add `Transfer` type
- [ ] Add `AccountAdjustment` type
- [ ] Update `Income` type to include `toAccountId`
- [ ] Update `Expense` type to include `fromAccountId`
- [ ] Update `CreditCard` type to include `accountId`
- [ ] Add helper types for account groups and account types

### Service Layer

- [ ] Add account fetch/insert/update/delete methods
- [ ] Add transfer fetch/insert/delete methods
- [ ] Add account adjustment fetch/insert/delete methods
- [ ] Add account-aware income methods
- [ ] Add account-aware expense methods
- [ ] Add account-aware card methods

### Shared Helpers

- [ ] Create `src/lib/accountBalances.ts`
- [ ] Create `src/lib/accountLedger.ts`
- [ ] Create helpers for:
  - [ ] current account balance
  - [ ] grouped totals by account type
  - [ ] liability formatting
  - [ ] unified ledger row mapping

### App State

- [ ] Add `accounts` state in [src/App.vue](/d:/code/expense-tracker/src/App.vue)
- [ ] Add `transfers` state
- [ ] Add `accountAdjustments` state
- [ ] Add loaders and refresh functions
- [ ] Keep legacy loaders working during migration period

### Done When

- [ ] Frontend can load and display accounts and transfers from Supabase
- [ ] Shared balance helpers pass tests
- [ ] No page yet depends on deleting legacy data

## Phase 3: Accounts and Transfers UI

### Accounts UI

- [ ] Create [src/views/AccountsPage.vue](/d:/code/expense-tracker/src/views/AccountsPage.vue)
- [ ] Create [src/components/AccountForm.vue](/d:/code/expense-tracker/src/components/AccountForm.vue)
- [ ] Show current balances by account
- [ ] Show grouped totals for assets and liabilities
- [ ] Show account ledger view
- [ ] Support manual opening balance / adjustment entries if included in first release

### Transfers UI

- [ ] Create [src/views/TransfersPage.vue](/d:/code/expense-tracker/src/views/TransfersPage.vue)
- [ ] Create [src/components/TransferForm.vue](/d:/code/expense-tracker/src/components/TransferForm.vue)
- [ ] Support:
  - [ ] payroll to cash withdrawal
  - [ ] bank to savings transfer
  - [ ] bank to e-wallet transfer
  - [ ] account to credit card payment

### Navigation

- [ ] Add `Accounts` page to navigation
- [ ] Add `Transfers` page to navigation
- [ ] Keep old `Savings` page available as legacy view until cutover

### Done When

- [ ] Users can create and inspect account balances
- [ ] Users can move money between asset accounts
- [ ] Users can make credit card payments through transfers

## Phase 4: Income and Expenses Cutover

### Income

- [ ] Update [src/components/IncomeForm.vue](/d:/code/expense-tracker/src/components/IncomeForm.vue) to require destination account
- [ ] Update [src/views/IncomePage.vue](/d:/code/expense-tracker/src/views/IncomePage.vue) summaries to use real destination accounts
- [ ] Remove dependence on "available income" as a global pooled balance

### Expenses

- [ ] Update [src/components/ExpenseForm.vue](/d:/code/expense-tracker/src/components/ExpenseForm.vue) to require `fromAccountId`
- [ ] Remove legacy funding source selector for new writes
- [ ] Remove special `Savings` transfer handling for new writes
- [ ] Treat credit-card-funded expenses as expenses from a credit card account

### App Logic

- [ ] Replace old `persistIncomeRecord` path with account-aware write path
- [ ] Replace old `persistExpenseRecord` path with account-aware write path
- [ ] Stop creating linked savings rows for new writes
- [ ] Stop relying on global `getAvailableIncomeBalance()` logic for new pages

### Legacy Boundary

- [ ] Make it explicit in code which pages still read legacy data
- [ ] Ensure new writes do not double-write into legacy balance systems

### Done When

- [ ] Income increases only the selected destination account
- [ ] Expenses decrease only the selected source account
- [ ] A payroll-to-cash movement is always a transfer, not an expense workaround

## Phase 5: Credit Card Cutover

### Data Model

- [ ] Create one linked account row for each credit card
- [ ] Ensure card account type is `credit_card`
- [ ] Ensure each `credit_cards` row references `account_id`

### UI Logic

- [ ] Update [src/views/CreditCardsPage.vue](/d:/code/expense-tracker/src/views/CreditCardsPage.vue) to read charges from expenses on card accounts
- [ ] Update card payments to read from transfers into card accounts
- [ ] Keep card metadata management in the existing credit-card page

### Old Data and Old Write Path

- [ ] Disable new inserts into legacy `credit_card_transactions`
- [ ] Keep old rows readable during migration period if needed
- [ ] Remove sync code that creates standalone card payment rows once cutover is complete

### Done When

- [ ] Card purchases are single expense records from a card account
- [ ] Card payments are single transfer records to a card account
- [ ] Card balances are derived without duplicate ledgers

## Phase 6: Recurring Cutover

### Schema

- [ ] Add `recurring_rules` v2 or equivalent schema
- [ ] Keep old recurring rows untouched until migration is verified

### Rule Types

- [ ] Support recurring income with destination account
- [ ] Support recurring expense with source account
- [ ] Support recurring transfer with source and destination accounts

### Runtime

- [ ] Update recurring processor to generate account-aware records
- [ ] Add idempotency checks for recurring generation
- [ ] Add automated tests for recurring account-aware writes

### Done When

- [ ] Recurring rules can generate income, expense, and transfer flows without using legacy savings or card transaction sync behavior

## Phase 7: Dashboard, Reports, and Legacy Archive Handling

### Dashboard

- [ ] Replace "available income" metrics with:
  - [ ] cash on hand
  - [ ] total assets
  - [ ] total liabilities
  - [ ] net position
  - [ ] top account balances

### Reports

- [ ] Add reporting by source account
- [ ] Add reporting by destination account
- [ ] Add transfer reporting
- [ ] Add account trend reporting if in scope

### Legacy Archive

- [ ] Decide whether old savings and card transaction pages remain visible as archive pages
- [ ] Add cutover notice explaining that live balances are accurate from the cutover date forward
- [ ] Ensure archive history cannot alter current balances

### Done When

- [ ] The product clearly separates live account-based balances from pre-cutover archive history

## Phase 8: Production Cutover and Cleanup

### Pre-Cutover

- [ ] Rehearse schema migration in staging
- [ ] Rehearse account creation and opening-balance setup in staging
- [ ] Validate manual test scenarios end to end
- [ ] Confirm data backup before production migration

### Cutover

- [ ] Run production schema changes
- [ ] Create account rows for each active tracker
- [ ] Record opening balances for each tracker
- [ ] Enable new write paths
- [ ] Disable legacy write paths

### Post-Cutover Monitoring

- [ ] Check account balances on several real trackers
- [ ] Check card balances against expected liabilities
- [ ] Check recurring runs after the first scheduled cycle
- [ ] Watch for duplicate entries or negative balance anomalies

### Cleanup

- [ ] Remove dead code after one stable release cycle
- [ ] Drop legacy tables only after backup and verification
- [ ] Update docs and onboarding copy

### Done When

- [ ] Production writes all use the account-based model
- [ ] Legacy write code is no longer active
- [ ] Core balance scenarios are verified in production

## Manual Verification Checklist

- [ ] Salary into Payroll Account
- [ ] Part-time income into Cash
- [ ] Income into e-wallet
- [ ] Payroll Account to Cash withdrawal
- [ ] Cash expense
- [ ] Expense from checking account
- [ ] Transfer from checking to savings
- [ ] Credit card purchase
- [ ] Credit card payment from Payroll Account
- [ ] Credit card payment from Cash
- [ ] Opening balance adjustment
- [ ] Delete or reverse a recent transfer
- [ ] Recurring income run
- [ ] Recurring transfer run
- [ ] Recurring expense run

## Suggested First Implementation Slice

The safest first code slice is:

1. Add test tooling
2. Add `accounts`, `transfers`, and `account_adjustments` schema
3. Add TypeScript types and balance helpers
4. Add an `Accounts` page that is read-only or minimally writable

Do not start by rewriting the current Income or Expenses pages first.

That would put new product behavior on top of an unstable base. The shared account model should exist first, then the transactional pages can move onto it cleanly.
