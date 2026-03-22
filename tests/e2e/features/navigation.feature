Feature: Navigation

  Scenario: Navigate to About page
    Given I visit the calculator page
    When I click the "About" navigation link
    Then I should see the About page content
    And the URL should contain "/about"

  Scenario: Navigate back to Calculator
    Given I am on the About page
    When I click the "Calculator" navigation link
    Then I should see the calculator form
    And the URL should not contain "/about"

  Scenario: Browser back button
    Given I visit the calculator page
    When I click the "About" navigation link
    And I go back in the browser
    Then I should see the calculator form

  Scenario: Browser forward button
    Given I visit the calculator page
    When I click the "About" navigation link
    And I go back in the browser
    And I go forward in the browser
    Then I should see the About page content

  Scenario: Direct URL access to About
    When I visit "/about" directly
    Then I should see the About page content

  Scenario: Logo click from About page navigates to calculator
    Given I am on the About page
    When I click the logo
    Then I should see the calculator form
    And the URL should not contain "/about"

  Scenario: Navigate to Learn page
    Given I visit the calculator page
    When I click the "Learn" navigation link
    Then I should see the Learn page content
    And the URL should contain "/learn"

  Scenario: Navigate from Learn to About
    Given I am on the Learn page
    When I click the "About" navigation link
    Then I should see the About page content

  Scenario: Logo click resets calculator to clean state
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see results
    When I click the logo
    Then I should see the calculator form
    And I should not see results
    And the URL should not contain "province"

  # --- Mode switching and intra-route navigation ---

  Scenario: Switching to reverse mode updates URL
    Given I visit the calculator page
    When I switch to reverse mode
    Then I should see the reverse calculator
    And the URL should contain "mode=reverse"

  Scenario: Switching back to forward mode clears URL
    Given I visit the calculator page
    When I switch to reverse mode
    And I switch to forward mode
    Then I should see the forward calculator
    And the URL should not contain "mode=reverse"
    And the URL should not contain query parameters

  Scenario: Back button restores forward mode after switching to reverse
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see results
    When I switch to reverse mode
    Then the URL should contain "mode=reverse"
    And I should not see results
    When I press Back on the same page
    Then I should see the forward calculator
    And I should see results
    And the URL should contain "donation=500"

  Scenario: Back button restores reverse mode after switching to forward
    When I visit the calculator with "?province=ON&income=80000&mode=reverse&refund=100"
    Then I should see the reverse calculator
    When I switch to forward mode
    Then I should see the forward calculator
    When I press Back on the same page
    Then I should see the reverse calculator
    And the URL should contain "mode=reverse"
    And the URL should contain "refund=100"

  Scenario: Deep link to bare reverse mode
    When I visit the calculator with "?mode=reverse"
    Then I should see the reverse calculator

  Scenario: Deep link to full reverse state
    When I visit the calculator with "?province=ON&income=80000&mode=reverse&refund=100"
    Then I should see the reverse calculator
    And the URL should contain "province=ON"
    And the URL should contain "refund=100"

  # Flaky: history.back() timeout — see https://github.com/danielabar/charitable-tax-credit-calculator-canada/issues/11
  @fixme
  Scenario: Calculator state preserved after navigating away and back
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    And I click the "About" navigation link
    And I go back in the browser
    Then I should see results
    And the URL should contain "province=ON"
