Feature: Reverse calculator mode
  Users can switch to reverse mode to find out how much they need to donate
  to get a specific amount back. The slider provides live feedback based on
  their province and income.

  Background:
    Given I visit the calculator page

  # --- Slider: fully usable ---

  Scenario: Slider shows donation needed for full taxpayer
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I enter "80000" as my reverse income
    And I set the refund slider to 100
    Then the donate display should show a dollar amount
    And the refund display should show "$100"
    And there should be no slider warning
    And the donation breakdown should be visible
    And the disclaimer should be shown

  # --- Slider: partly unused ---

  Scenario: Slider shows partial warning for low-income taxpayer
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I enter "16000" as my reverse income
    And I set the refund slider to 200
    Then a partial credit warning should be visible
    And the warning should mention the income needed
    And the disclaimer should be shown

  # --- Slider: entirely unused ---

  Scenario: Slider shows not-possible warning for non-taxpayer
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I enter "10000" as my reverse income
    And I set the refund slider to 100
    Then a not-possible warning should be visible
    And the refund display should show "$0"
    And the warning should mention the income needed
    And the disclaimer should be shown

  # --- Optimistic mode (no income entered) ---

  Scenario: Slider works without income in optimistic mode
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I set the refund slider to 100
    Then the donate display should show a dollar amount
    And the refund display should show "$100"
    And there should be no slider warning
    And the disclaimer should be shown

  # --- Forward mode still works after visiting reverse ---

  Scenario: Forward calculator still works after visiting reverse mode
    When I switch to reverse mode
    And I switch to forward mode
    And I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    Then I should see results
    And the bottom line should say "You get"

  # --- URL state ---

  Scenario: Reverse mode URL contains mode and refund params
    When I switch to reverse mode
    And I select "Ontario" as my reverse province
    And I enter "80000" as my reverse income
    And I set the refund slider to 100
    Then the URL should contain "mode=reverse"
    And the URL should contain "refund=100"
    And the URL should contain "province=ON"

  Scenario: Page hydrates reverse mode with form values from URL
    When I visit the calculator with "?mode=reverse&province=ON&income=80000&refund=100"
    Then I should see the reverse calculator
    And the reverse province should show "Ontario"
    And the reverse income should contain "80000"
    And the refund slider should be at 100
    And the donate display should show a dollar amount
    And the disclaimer should be shown
