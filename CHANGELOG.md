# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

Initial release. Phase 1.

### Added

- Country data model (`CountryConfig`) and Cameroon (`cm`), with operator prefixes marked for verification against the current ART allocation.
- `formatFcfa` and `<Currency />`: FCFA (XAF/XOF) formatting with zero decimals and French spacing.
- Phone parsing: operator detection from prefix, length validation, E.164 output.
- `<PhoneInput />`, `<PaymentMethodPicker />`, `<UssdPrompt />`.
- `momo-checkout` block with an idle → awaiting approval → success / failed / timeout state machine and a receipt card.
- FR/EN dictionary and `MboaProvider`.
- Docs site with a live checkout demo.
