Feature: Learn page
  The Learn page shows taxpayer category scenarios with dynamically
  computed values to help users understand how the credit works.

  Scenario: Navigate to Learn page from nav
    Given I visit the calculator page
    When I click the "Learn" navigation link
    Then I should see the Learn page content
    And the URL should contain "/learn"

  Scenario: Navigate from Learn back to Calculator
    Given I am on the Learn page
    When I click the "Calculator" navigation link
    Then I should see the calculator form

  Scenario: Direct URL access to Learn page
    When I visit "/learn" directly
    Then I should see the Learn page content

  Scenario: Learn page shows four scenario cards
    Given I am on the Learn page
    Then I should see 4 scenario cards
    And the non-taxpayer card should show $0 gets back
    And the partial taxpayer card should show a partial amount back
    And the full taxpayer cards should show the full credit back

  Scenario: Learn page shows computed values not placeholders
    Given I am on the Learn page
    Then all scenario cards should show dollar amounts
    And no card should contain placeholder text

  Scenario: CTA links to calculator
    Given I am on the Learn page
    When I click the calculator CTA
    Then I should see the calculator form

  Scenario: Logo click from Learn page navigates to calculator
    Given I am on the Learn page
    When I click the logo
    Then I should see the calculator form
