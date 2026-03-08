Feature: Tax credit calculator

  Scenario: Credit fully usable for Ontario high-income donor
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see results
    And the results should show a credit amount
    And I should see the disclaimer

  Scenario: Credit entirely wasted for low-income donor
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see results
    And the results should indicate credit is wasted

  Scenario: Headline shows out-of-pocket cost when credit is fully usable
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then the headline should contain "Actually costs you"

  Scenario: Headline shows warning when credit is entirely wasted
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then the headline should contain "Won't reduce your taxes"

  Scenario: Narrative shows basic sections when credit is fully usable
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see the "basic-math" narrative section
    And I should see the "tax-situation" narrative section
    And I should not see the "non-refundable" narrative section
    And I should not see the "carry-forward" narrative section

  Scenario: Narrative shows non-refundable explanation when credit is partly wasted
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "13000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see the "non-refundable" narrative section
    And I should see the "carry-forward" narrative section
    And I should see the "spouse-option" narrative section
    And I should see the "minimum-income" narrative section

  Scenario: Narrative shows non-refundable explanation when credit is entirely wasted
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see the "non-refundable" narrative section
    And I should see the "carry-forward" narrative section
    And I should see the "spouse-option" narrative section
    And I should see the "minimum-income" narrative section
    And I should see the "closing" narrative section

  Scenario: Shows threshold nudge for donation near $200
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "180" as my donation
    And I click Calculate
    Then I should see the "threshold-nudge" narrative section

  Scenario: Suppresses nudge when credit is wasted
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "180" as my donation
    And I click Calculate
    Then I should not see the "threshold-nudge" narrative section

  Scenario: Suppresses nudge when donation is well below threshold
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "100" as my donation
    And I click Calculate
    Then I should not see the "threshold-nudge" narrative section

  Scenario: Suppresses nudge when donation is above threshold
    Given I visit the calculator page
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should not see the "threshold-nudge" narrative section
