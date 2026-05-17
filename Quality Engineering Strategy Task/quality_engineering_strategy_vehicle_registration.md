# Quality Engineering Strategy – Renew Vehicle Registration Journey

## Context
This approach is based on my experience working on the Renew Registration service at Service NSW.

In this journey, our squad was responsible for the registration renewal flow itself, while some parts were owned by other teams:
- The login and identity verification steps were handled by the MyServiceNSW Account team.
- Payment processing and payment pages were owned by the Payments team.

Because of that, my focus was on making sure the registration journey worked reliably from the point where the customer entered their vehicle details through to the confirmation page.

---

## How I Would Build Confidence in This Journey

For a service like this, the biggest risks sit in the backend integrations.

The vehicle and registration data returned by the backend can vary significantly depending on:
- Vehicle type
- Usage type (private, business, etc.)
- Registration status
- Concessions or exemptions

That data drives what the customer sees on screen, including fees, labels, warnings, and next steps.

If the mapping is wrong, the customer could see incorrect information.

For that reason, I would put most of the testing effort into API and integration testing, supported by unit and component tests. UI automation would be kept lean, and I would maintain a single happy-path end-to-end test to confirm the overall journey works.

---

## Recommended Test Strategy

My approach would look like this:

- **API and contract tests** – main focus
- **Unit and component tests** – strong coverage for business rules and UI logic
- **Targeted UI tests** – only for critical customer interactions
- **One end-to-end happy path** – to verify the complete integration

This gives fast feedback, reduces test maintenance, and provides confidence in the areas that matter most.

---

## Key Risks

### Functional Risks
- Incorrect vehicle or registration data returned from backend services.
- Data not mapped correctly to the UI.
- Incorrect fee displayed.
- Confirmation page not shown after successful completion.
- Session timeout while the user is completing the journey.

### Non-Functional Risks
- Unstable backend services.
- Third-party outages.
- Slow response times during peak periods.
- Accessibility issues.
- Breaking API changes introduced by dependent teams.

### Delivery Risks
- Multiple teams releasing changes independently.
- Inconsistent test environments.
- Poor test data.
- Flaky automation.

---

# Testing Approach by Layer

## Unit and Component Tests

These are the first line of defence and should cover:
- Validation rules.
- Fee display logic.
- Conditional rendering.
- Error message mapping.
- Loading and timeout states.

These tests are quick to run and provide immediate feedback in CI.

---

## API and Contract Tests (Primary Focus)

This is where I would invest most of the effort.

### What I Would Validate
- Vehicle details lookup.
- Registration data retrieval.
- Fee calculation service.
- Confirmation service.
- Data mapping for different vehicle and usage types.

### Why This Matters
The response payloads can vary depending on the type of vehicle and registration scenario. I would validate that each important field is mapped correctly so the UI shows the right information to the customer.

### Contract Testing
I would use consumer-driven contract testing to ensure upstream teams do not introduce breaking changes.

### Mock Servers
Where backend services are unstable, I would use mock servers such as WireMock to simulate:
- Successful responses.
- Standard error responses.
- Timeouts.

This allows us to test reliably without depending on unstable systems.

### Negative Scenarios
I would not automate every negative scenario. If the API returns a common error structure, validating one representative error response is usually enough to prove the handling works.

---

## UI Tests

UI automation would focus on:
- Entering vehicle details.
- Reviewing fees.
- Confirmation page.
- Accessibility checks.

### Accessibility
I would include:
- Automated axe checks.
- Keyboard navigation.
- Basic screen reader validation.

### What I Would Exclude
- Login pages.
- Payment pages.

These are owned and tested by other teams.

---

## End-to-End Tests

I would keep only one happy-path end-to-end test covering:
1. Enter vehicle details.
2. Retrieve registration and fee information.
3. Proceed through payment handoff.
4. Display confirmation.

This provides confidence that all systems are integrated correctly.

I would avoid building a large E2E suite because most business logic is already covered at lower levels.

---

## What I Would Prioritise

1. API and contract tests.
2. Data validation and mapping for different vehicle types.
3. Unit and component tests.
4. Accessibility checks.
5. One happy-path E2E test.
6. Performance testing during peak periods.

---

## What I Would De-prioritise

- Login-related testing.
- Payment-page testing.
- Multiple UI tests for backend variations.
- Automating every negative scenario.
- Large end-to-end regression suites.

---

## Where I Would Avoid UI-Based Tests

I would avoid using UI tests for:
- Backend response validation.
- Contract verification.
- Fee calculation logic.
- Error response handling.
- Timeout and retry logic.

These are much faster and more reliable to test at the API or component level.

---

## How I Would Shift Left

### During Design
- Participate in story refinement.
- Review acceptance criteria.
- Identify edge cases and integration risks.
- Confirm API contracts.
- Ensure accessibility requirements are included.

### During Development
- Work closely with developers.
- Build automated tests alongside the code.
- Use mocks for unstable services.
- Review coverage before merging.

### In CI/CD
Run on every pull request:
- Unit and component tests.
- API and contract tests.
- Accessibility scans.
- Static code analysis.

Before release:
- Happy-path E2E test.
- Performance smoke tests.

After release:
- Synthetic monitoring.
- Real user monitoring.
- Alerting.

---

## Non-Functional Testing

### Performance
I would test the journey under peak load to ensure response times remain within acceptable limits.

### Accessibility
I would combine automated and manual testing to confirm WCAG compliance.

### Security
Security scanning and authentication testing would be handled as part of the broader enterprise controls.

---

## Production Monitoring

Once the feature is live, I would monitor:
- Completion rate.
- API latency.
- Error rates.
- User drop-off.
- Confirmation success rate.

This helps detect issues that may not appear in lower environments.

---

## Summary

My strategy is to focus heavily on API and backend integration testing, because that is where the greatest risk lies.

I would:
- Validate backend responses thoroughly.
- Confirm that data is mapped correctly to the UI.
- Use mock servers for unstable dependencies.
- Keep UI automation focused and lightweight.
- Run one happy-path end-to-end test.
- Shift quality left by embedding testing into design, development, and CI/CD.

This is the same practical approach I used while working on the Renew Registration journey at Service NSW to deliver reliable and scalable releases with strong confidence and fast feedback.