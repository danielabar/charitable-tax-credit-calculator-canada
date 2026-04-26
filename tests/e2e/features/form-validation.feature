Feature: Form validation

  Scenario: Cannot calculate with empty fields
    Given I visit the calculator page
    When I click Calculate
    Then I should see a validation message for the province field
    And I should see a validation message for the income field
    And I should see a validation message for the donation field

  Scenario: Can fill in all fields
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    Then the Calculate button should be enabled

  Scenario: Income explainer is visible and expands on click
    Given I visit the calculator page
    Then I should see the "What should I enter?" income explainer
    And the income explainer should be collapsed
    When I click the "What should I enter?" income explainer
    Then the income explainer should be expanded
    And the income explainer should mention working, retired, self-employed, and investments
    And the income explainer should include a "Learn more" link
