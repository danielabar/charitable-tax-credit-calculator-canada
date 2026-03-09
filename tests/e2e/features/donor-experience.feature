Feature: Donor experience
  The calculator shows different results depending on the donor's income
  and donation amount. These scenarios verify the complete experience
  for each distinct situation — what appears, what doesn't, and why.

  Background:
    Given I visit the calculator page

  Scenario: Full benefit — donation above $200
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "500" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "Actually costs you"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show federal credit, provincial credit, and total credit
    # Visual breakdown
    And the visual breakdown should show cost versus credit
    # Narrative
    And the explanation should show tiered rates for donations above $200
    And the tax situation should confirm the full credit is usable
    # Sections that should NOT appear for full benefit
    And the results should not include the $200 threshold nudge
    And the results should not include the non-refundable credit explanation
    And the results should not include carry-forward or spouse options
    And the results should not include the minimum income section
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Full benefit — donation near $200
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "180" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "Actually costs you"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show federal credit, provincial credit, and total credit
    # Visual breakdown
    And the visual breakdown should show cost versus credit
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should confirm the full credit is usable
    And the results should include the $200 threshold nudge
    # Sections that should NOT appear
    And the results should not include the non-refundable credit explanation
    And the results should not include carry-forward or spouse options
    And the results should not include the minimum income section
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Full benefit — donation well below $200
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "100" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "Actually costs you"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show federal credit, provincial credit, and total credit
    # Visual breakdown
    And the visual breakdown should show cost versus credit
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should confirm the full credit is usable
    # Sections that should NOT appear — no nudge (too far from $200)
    And the results should not include the $200 threshold nudge
    And the results should not include the non-refundable credit explanation
    And the results should not include carry-forward or spouse options
    And the results should not include the minimum income section
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit partly wasted — donation above $200
    When I select "Ontario" as my province
    And I enter "13000" as my income
    And I enter "500" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "Will save you"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, credit usable, and credit wasted
    # Visual breakdown
    And the visual breakdown should show usable versus wasted credit
    # Narrative
    And the explanation should show tiered rates for donations above $200
    And the tax situation should say income is mostly sheltered by the basic personal amount
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    # Sections that should NOT appear
    And the results should not include the $200 threshold nudge
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit partly wasted — donation near $200 (nudge suppressed)
    When I select "Ontario" as my province
    And I enter "13000" as my income
    And I enter "180" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "Will save you"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, credit usable, and credit wasted
    # Visual breakdown
    And the visual breakdown should show usable versus wasted credit
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say income is mostly sheltered by the basic personal amount
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    # Critical: nudge must NOT appear — credit is already partly wasted
    And the results should not include the $200 threshold nudge
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit partly wasted — donation well below $200
    When I select "Ontario" as my province
    And I enter "13000" as my income
    And I enter "100" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "Will save you"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, credit usable, and credit wasted
    # Visual breakdown
    And the visual breakdown should show usable versus wasted credit
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say income is mostly sheltered by the basic personal amount
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    # No nudge — credit wasted AND far from $200
    And the results should not include the $200 threshold nudge
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit entirely wasted — donation above $200
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "500" as my donation
    And I click Calculate
    # Bottom line — warning tone
    Then the bottom line should say "Won't reduce your taxes"
    And the bottom line should show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, credit usable, and credit wasted
    # No visual breakdown for entirely wasted
    And there should be no visual breakdown
    # Narrative
    And the explanation should show tiered rates for donations above $200
    And the tax situation should say no tax is owed
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include the closing encouragement
    # No nudge — all credit is wasted
    And the results should not include the $200 threshold nudge
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit entirely wasted — donation near $200 (nudge suppressed)
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "180" as my donation
    And I click Calculate
    # Bottom line — warning tone
    Then the bottom line should say "Won't reduce your taxes"
    And the bottom line should show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, credit usable, and credit wasted
    # No visual breakdown
    And there should be no visual breakdown
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say no tax is owed
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include the closing encouragement
    # Critical: nudge must NOT appear — entire credit is wasted
    And the results should not include the $200 threshold nudge
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit entirely wasted — donation well below $200
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "100" as my donation
    And I click Calculate
    # Bottom line — warning tone
    Then the bottom line should say "Won't reduce your taxes"
    And the bottom line should show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, credit usable, and credit wasted
    # No visual breakdown
    And there should be no visual breakdown
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say no tax is owed
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include the closing encouragement
    # No nudge — credit wasted AND far from $200
    And the results should not include the $200 threshold nudge
    # Disclaimer
    And the disclaimer should be shown
