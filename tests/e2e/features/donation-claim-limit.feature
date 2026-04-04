Feature: CRA 75% donation claiming limit warning

  Background:
    Given I visit the calculator page

  Scenario: Forward mode — donation under 75% of income shows no warning
    When I select "Ontario" as my province
    And I enter "150000" as my income
    And I enter "50000" as my donation
    And I click Calculate
    Then the results should appear
    And I should not see the CRA claiming limit warning

  Scenario: Forward mode — donation over 75% of income shows warning
    When I select "Ontario" as my province
    And I enter "150000" as my income
    And I enter "120000" as my donation
    And I click Calculate
    Then the results should appear
    And I should see the CRA claiming limit warning
    And the warning should mention "75% of your net income"
    And the warning should mention "carried forward"
    And the warning should mention "Schedule 9"

  Scenario: Forward mode — donation exactly at 75% shows no warning
    When I select "Ontario" as my province
    And I enter "100000" as my income
    And I enter "75000" as my donation
    And I click Calculate
    Then the results should appear
    And I should not see the CRA claiming limit warning
