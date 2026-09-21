# Security policy

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Include what you found, how to reproduce it, and which version or commit it affects.

You should get a first reply within a few days. Please give us a reasonable time to fix the problem before you share it publicly.

## Scope

mboa-ui is a set of UI components that you copy into your own project. It **does not talk to any payment provider**, and it never sees your API keys. Your backend does that, through the `onPay` and `onCheckStatus` functions you write.

That shapes what counts as a vulnerability here:

- **In scope:** a component that leaks data it is given, renders untrusted text as HTML, builds a link (such as the `tel:` dial link) from unsafe input, or otherwise behaves insecurely.
- **In scope:** the registry or the docs site serving something other than what the repository contains.
- **Out of scope:** the security of your payment backend, your provider, or how you confirm payments. The checkout's receipt is a display of what your backend reports, so always confirm a payment on your server before you deliver anything.

## Card and PayPal payments

The components never collect card numbers. To take cards or PayPal, use your provider's own hosted fields or buttons, so card data goes straight from the customer to the provider and never passes through your page or your server. Do not build a card form out of plain inputs.

## Supported versions

mboa-ui is pre-release (0.1.0 in development). Fixes go to the latest version on the default branch.
