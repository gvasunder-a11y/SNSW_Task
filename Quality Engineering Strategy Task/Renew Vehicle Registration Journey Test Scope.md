# Renew Vehicle Registration Journey Test Scope 

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

My approach would be:

- **API and contract tests: main focus**  
  This is where most of the risk sits, especially with multiple backend and third-party integrations. Contract tests help ensure that changes made by one team do not unintentionally break other teams or downstream systems.

- **Unit and component tests: strong coverage for business rules and UI logic**  
  Core logic such as fee calculations, field validations, and conditional rules should be tested at this level. These tests are fast, reliable, and provide immediate feedback during development.

- **Targeted UI tests:  focused on critical customer interactions**  
  UI automation should cover key user actions such as entering vehicle details, reviewing fees, completing payment, and confirming successful submission. Automated accessibility checks should also be included to validate WCAG compliance.

- **End-to-end tests: limited to the critical happy path**  
  A small number of E2E tests will validate the complete journey from login through to payment confirmation, ensuring that all major systems integrate successfully.

- **Automated regression suite for release confidence**  
  I would build and maintain an automation framework covering all major happy path scenarios for the registration renewal journey. This regression suite would be executed as part of every release through the CI/CD pipeline to ensure that new changes do not impact existing functionality.

This approach provides fast feedback, keeps maintenance effort manageable, and gives the team confidence that the most business-critical parts of the journey continue to work as expected with every release.

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

- **API and contract tests**  
  This is the highest priority because most of the risk lies in the integration between internal and third-party services.

- **Data validation and mapping for different vehicle types**  
  Validate that fees, eligibility rules, and vehicle information are correctly retrieved and displayed for all supported vehicle categories and registration scenarios.

- **Unit and component tests**  
  Strong coverage of business rules, calculations, and validation logic to catch defects early and provide fast feedback.

- **Accessibility checks**  
  Automated and manual accessibility testing to ensure compliance with WCAG standards, including keyboard navigation, screen reader support, and colour contrast.

- **Automation framework covering all major happy path scenarios**  
  I would prioritise building and maintaining an automation framework that covers all key happy path scenarios. This suite would serve as the core regression pack and be executed during every release cycle through the CI/CD pipeline to ensure that new changes do not impact existing functionality.

- **One critical end-to-end happy path test**  
  A small number of E2E tests to validate the full customer journey from login through payment and confirmation.

- **Performance testing during peak periods**  
  Load and stress testing to ensure the application remains responsive and stable during high-volume renewal periods..

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

## How I Would Shift Left and Embed Quality

### During Design
I’d get involved as early as possible, ideally during story refinement and design discussions.

At this stage, I would:

- Review acceptance criteria to make sure they are clear, testable, and cover both happy paths and edge cases.
- Identify potential integration risks, especially where the journey depends on unstable or third-party services.
- Confirm API contracts and expected data formats between systems.
- Make sure accessibility requirements (WCAG), performance expectations, and security considerations are included from the beginning.
- Raise any testability concerns early, such as the need for feature flags, mocks, or better logging.

### During Development
I believe quality is a shared responsibility, so I’d work closely with developers throughout implementation.

My focus would be to:

- Build automated tests alongside the code rather than waiting until development is complete.
- Use mocks or stubs for unstable services so testing can continue even when dependencies are unavailable.
- Review pull requests with a focus on test coverage, error handling, and overall testability.
- Add new happy path scenarios to the automation framework so the regression suite grows as the product evolves.

### In CI/CD
The CI/CD pipeline should provide fast and reliable feedback.

**On every pull request, I’d run:**
- Unit and component tests
- API and contract tests
- Automated accessibility scans
- Static code analysis
- Security and dependency checks

**Before each release, I’d run:**
- The automated regression suite covering all major happy path scenarios
- One critical end-to-end test covering login to confirmation
- Performance smoke tests
- Final accessibility checks for impacted areas

**After release, I’d rely on:**
- Synthetic monitoring of the registration renewal journey
- Real user monitoring
- Dashboards and alerting to detect issues quickly

This approach helps identify issues early, gives the team fast feedback, and ensures quality is built into the delivery process rather than treated as a final testing step.

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

My approach is to keep things practical and focus effort where it really matters, mainly at the API and backend integration level, since that’s usually where most of the risk sits in a journey like this.

I would:

- Spend most of the effort validating backend responses properly and making sure they are reliable and consistent.  
- Ensure data is correctly mapped all the way through to the UI, so what the user sees is accurate.  
- Use mock services or stubs for unstable or third-party dependencies so testing isn’t blocked or flaky.  
- Keep UI automation lightweight and focused only on key user interactions, rather than trying to cover everything through the UI.  
- Maintain one solid end-to-end happy path test to give confidence that the full journey works together.  
- Shift quality left by building testing into design discussions, development work, and the CI/CD pipeline rather than treating it as a final step.

Overall, this is a very practical approach I’ve used in work on journeys like the Renew Registration flow at Service NSW. It helps keep releases stable and predictable, while still giving fast feedback and confidence that changes haven’t broken anything important.