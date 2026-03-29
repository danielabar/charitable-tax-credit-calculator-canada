Feature: Input limits
  The calculator enforces maximum values on income and donation fields
  to keep results within the tool's supported range.

  # --- Forward mode ---

  Background:
    Given I visit the calculator page

  Scenario: Income above max shows error and blocks submission
    When I select "Ontario" as my province
    And I enter "600000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see a validation error on the income field
    And the income error should mention "$500,000"
    And I should not see results

  Scenario: Income at exactly max submits successfully
    When I select "Ontario" as my province
    And I enter "500000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see results

  Scenario: Donation above max shows error and blocks submission
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "300000" as my donation
    And I click Calculate
    Then I should see a validation error on the donation field
    And the donation error should mention "$250,000"
    And I should not see results

  Scenario: Donation at exactly max submits successfully
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "250000" as my donation
    And I click Calculate
    Then I should see results

  # --- Reverse mode ---

  Scenario: Reverse income above max shows error
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I enter "600000" as my reverse income
    And I set the refund slider to 100
    Then I should see a validation error on the reverse income field
    And the reverse income error should mention "$500,000"

  Scenario: Reverse negative income shows error
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I enter "-5000" as my reverse income
    And I set the refund slider to 100
    Then I should see a validation error on the reverse income field

  Scenario: Reverse blank income uses optimistic mode without error
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I set the refund slider to 100
    Then the donate display should show a dollar amount
    And there should be no validation error on the reverse income field
