# InvenTree Parts Module — Playwright UI Tests

This directory contains Playwright automation scripts for the **InvenTree Parts** module,
targeting the [InvenTree Demo Server](https://demo.inventree.org).

---

## 📂 Test Files

| File | Scenarios Covered |
|------|-------------------|
| `part_creation_workflow.spec.ts` | **SMOKE TEST** — Full end-to-end part creation workflow + form structure validation |
| `part_creation_menu.spec.ts` | Accessing the Part Creation Menu (positive & negative permission scenarios) |
| `part_create_form_required_fields.spec.ts` | Create Part Form — required fields, blank-name validation, duplicate name edge case |

---

## 🧪 Scenarios Tested

### Sub-Page: Creating a Part

#### Entity 1 — Accessing the Part Creation Menu

| Test ID | Type | Description |
|---------|------|-------------|
| TC-MENU-01 | Positive | "Add Parts" button is visible for user with create permission |
| TC-MENU-02 | Positive | Dropdown contains "Create Part" option |
| TC-MENU-03 | Positive | Dropdown contains "Import from File" option |
| TC-MENU-04 | Positive | Clicking "Create Part" opens the Add Part modal dialog |
| TC-MENU-05 | Negative | "Add Parts" button is NOT visible for read-only user |

#### Entity 2 — Create Part Form Required Fields

| Test ID | Type | Description |
|---------|------|-------------|
| TC-FORM-01 | Positive | Submit with Name + Description + Category → redirected to part detail page |
| TC-FORM-02 | Negative | Submit with blank Name → inline validation error displayed |
| TC-FORM-03 | Edge Case | Submit duplicate part name → allowed or validation error |

#### Smoke Test

| Test ID | Type | Description |
|---------|------|-------------|
| SMOKE-TC-001 | Positive (E2E) | Full part creation workflow from login to detail page |
| TC-STRUCT-01 | Structural | Dialog contains all expected input fields |
| TC-STRUCT-02 | Structural | Default switch states (Active ON, Component ON) |
| TC-STRUCT-03 | Structural | Cancel closes dialog without creating a part |

---

## ⚙️ Setup & Installation

```bash
# From this directory
cd tests/ui/parts

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

---

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run only the smoke test
npm run test:smoke

# Run with browser visible (headed mode)
npm run test:headed

# Run specific test file
npx playwright test part_creation_menu.spec.ts --config=playwright.config.ts

# View HTML report
npm run report
```

---

## 🔐 Credentials

| User | Password | Role |
|------|----------|------|
| `engineer` | `partsonly` | Has create permission for Parts |
| `reader` | `readonly` | Read-only, no create permission |

> **Note:** These are the public demo server credentials. Do not use in production.

---

## 📋 Configuration

- **Config file:** `playwright.config.ts`
- **Base URL:** `https://demo.inventree.org`
- **Parallelism:** Sequential (1 worker) to avoid conflicts on the shared demo server
- **Retries:** 1 on CI, 0 locally
- **Artifacts:** Traces, screenshots, and videos saved on failure to `test-results/`

---

## 📊 Test Results

After execution, find results in:

```
test-results/
├── html-report/     # Open with: npm run report
├── results.json     # Machine-readable JSON
└── artifacts/       # Traces, screenshots, videos
```

---

## 🏗️ Framework

- **Language:** TypeScript
- **Framework:** [Playwright](https://playwright.dev/) `^1.44.0`
- **Browsers:** Chromium, Firefox
