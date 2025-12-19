# Roadmap - Planned Features

This document outlines features planned for future releases but not yet implemented.

## Future Enhancements

### Transactional Email System (n8n Integration)

**Status:** Planned
**Priority:** Medium

**Vision:**
Use n8n for all transactional messaging (welcome emails, password resets, notifications).

**Benefits:**

- Decouples email logic from application code
- App triggers webhooks or writes to jobs table
- n8n handles provider complexity, templates, retries
- No direct SMTP/API integration in app

**Implementation Approach:**

- Webhook endpoints for email triggers
- Optional: Database jobs table for queued emails
- n8n workflows for each email type
- Template management in n8n

**Estimated Effort:** TBD

---

## How to Contribute

See planned features you'd like to implement? Check [CONTRIBUTING.md](../CONTRIBUTING.md) and open an issue to discuss before starting work.
