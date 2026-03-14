Feature: Shareable URLs and Start Over

  Scenario: URL updates after calculation
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see results
    And the URL should contain "province=ON"
    And the URL should contain "income=80000"
    And the URL should contain "donation=500"
    And the "Start over" button should be visible

  Scenario: Page hydrates from URL parameters
    When I visit the calculator with "?province=ON&income=80000&donation=500"
    Then the province dropdown should show "Ontario"
    And the income field should contain "80000"
    And the donation field should contain "500"
    And I should see results
    And the "Start over" button should be visible

  Scenario: Start Over resets everything
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    And I click "Start over"
    Then the province dropdown should show "Select your province..."
    And the income field should be empty
    And the donation field should be empty
    And the results should be hidden
    And the URL should not contain query parameters
    And the "Start over" button should be hidden

  Scenario: Invalid URL parameters are ignored gracefully
    When I visit the calculator with "?province=ON&income=abc&donation=500"
    Then the province dropdown should show "Select your province..."
    And the income field should be empty
    And the results should be hidden
