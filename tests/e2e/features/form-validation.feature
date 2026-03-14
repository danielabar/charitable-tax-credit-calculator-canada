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
