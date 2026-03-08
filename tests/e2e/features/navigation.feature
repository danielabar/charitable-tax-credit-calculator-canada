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
