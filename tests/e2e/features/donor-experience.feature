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
    Then the bottom line should say "You get"
    And the bottom line should say "back"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show federal credit, provincial credit, and total credit
    # Visual breakdown
    And the visual breakdown should show cost versus credit
    # Narrative
    And the explanation should show tiered rates for donations above $200
    And the explanation should not mention the top bracket bonus rate
    And the tax situation should confirm the full credit is usable
    # Sections that should NOT appear for full benefit
    And the results should not include the $200 threshold nudge
    And the results should not include the non-refundable credit explanation
    And the results should not include carry-forward or spouse options
    And the results should not include the minimum income section
    And the results should not include the closing encouragement
    And the results should not include any learn links
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Full benefit — donation near $200
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "180" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
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
    And the results should not include any learn links
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Full benefit — donation exactly $200 (nudge shown)
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "200" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
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
    And the results should not include any learn links
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Full benefit — donation well below $200
    When I select "Ontario" as my province
    And I enter "80000" as my income
    And I enter "100" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
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
    And the results should not include any learn links
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit partly unused — donation above $200
    When I select "Ontario" as my province
    And I enter "13000" as my income
    And I enter "500" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, amount back, and amount unused
    # Visual breakdown
    And the visual breakdown should show usable versus unused credit
    # Narrative
    And the explanation should show tiered rates for donations above $200
    And the tax situation should say income is mostly sheltered by the basic personal amount
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include a learn link in the non-refundable section
    # Sections that should NOT appear
    And the results should not include the $200 threshold nudge
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit partly unused — donation near $200 (nudge suppressed)
    When I select "Ontario" as my province
    And I enter "13000" as my income
    And I enter "180" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, amount back, and amount unused
    # Visual breakdown
    And the visual breakdown should show usable versus unused credit
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say income is mostly sheltered by the basic personal amount
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include a learn link in the non-refundable section
    # Critical: nudge must NOT appear — credit is already partly unused
    And the results should not include the $200 threshold nudge
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit partly unused — donation well below $200
    When I select "Ontario" as my province
    And I enter "13000" as my income
    And I enter "100" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
    And the bottom line should not show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, amount back, and amount unused
    # Visual breakdown
    And the visual breakdown should show usable versus unused credit
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say income is mostly sheltered by the basic personal amount
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include a learn link in the non-refundable section
    # No nudge — credit unused AND far from $200
    And the results should not include the $200 threshold nudge
    And the results should not include the closing encouragement
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit entirely unused — donation above $200
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "500" as my donation
    And I click Calculate
    # Bottom line — warning tone
    Then the bottom line should say "You get $0 back"
    And the bottom line should show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, amount back, and amount unused
    # No visual breakdown for entirely unused
    And there should be no visual breakdown
    # Narrative
    And the explanation should show tiered rates for donations above $200
    And the tax situation should say no tax is owed
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include the closing encouragement
    And the results should include a learn link in the non-refundable section
    And the results should include a learn link in the closing section
    # No nudge — all credit is unused
    And the results should not include the $200 threshold nudge
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit entirely unused — donation near $200 (nudge suppressed)
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "180" as my donation
    And I click Calculate
    # Bottom line — warning tone
    Then the bottom line should say "You get $0 back"
    And the bottom line should show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, amount back, and amount unused
    # No visual breakdown
    And there should be no visual breakdown
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say no tax is owed
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include the closing encouragement
    And the results should include a learn link in the non-refundable section
    And the results should include a learn link in the closing section
    # Critical: nudge must NOT appear — entire credit is unused
    And the results should not include the $200 threshold nudge
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Credit entirely unused — donation well below $200
    When I select "Ontario" as my province
    And I enter "10000" as my income
    And I enter "100" as my donation
    And I click Calculate
    # Bottom line — warning tone
    Then the bottom line should say "You get $0 back"
    And the bottom line should show a warning
    # Credit summary
    And the credit summary should show credit calculated, estimated tax, amount back, and amount unused
    # No visual breakdown
    And there should be no visual breakdown
    # Narrative
    And the explanation should show a single rate for donations under $200
    And the tax situation should say no tax is owed
    And the results should include the non-refundable credit explanation
    And the results should include carry-forward and spouse options
    And the results should include the minimum income section
    And the results should include the closing encouragement
    And the results should include a learn link in the non-refundable section
    And the results should include a learn link in the closing section
    # No nudge — credit unused AND far from $200
    And the results should not include the $200 threshold nudge
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Full benefit — top bracket earner, donation above $200
    When I select "Ontario" as my province
    And I enter "300000" as my income
    And I enter "500" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
    And the bottom line should not show a warning
    # Credit summary — surtax relief shown for high-income Ontario
    And the credit summary should show federal credit, provincial credit, surtax relief, and total savings
    # Visual breakdown
    And the visual breakdown should show cost versus credit
    # Narrative — should mention the 33% top bracket bonus
    And the explanation should show tiered rates for donations above $200
    And the explanation should mention the top bracket bonus rate
    And the tax situation should confirm the full credit is usable
    # Sections that should NOT appear
    And the results should not include the $200 threshold nudge
    And the results should not include the non-refundable credit explanation
    And the results should not include carry-forward or spouse options
    And the results should not include the minimum income section
    And the results should not include the closing encouragement
    And the results should not include any learn links
    # Disclaimer
    And the disclaimer should be shown

  Scenario: Full benefit — top bracket earner, donation below $200
    When I select "Ontario" as my province
    And I enter "300000" as my income
    And I enter "100" as my donation
    And I click Calculate
    # Bottom line
    Then the bottom line should say "You get"
    And the bottom line should say "back"
    And the bottom line should not show a warning
    # Credit summary — surtax relief shown for high-income Ontario
    And the credit summary should show federal credit, provincial credit, surtax relief, and total savings
    # Visual breakdown
    And the visual breakdown should show cost versus credit
    # Narrative — should NOT mention 33% (donation is below $200, only lowRate applies)
    And the explanation should show a single rate for donations under $200
    And the explanation should not mention the top bracket bonus rate
    And the tax situation should confirm the full credit is usable
    # Sections that should NOT appear — no nudge (well below $200)
    And the results should not include the $200 threshold nudge
    And the results should not include the non-refundable credit explanation
    And the results should not include carry-forward or spouse options
    And the results should not include the minimum income section
    And the results should not include the closing encouragement
    And the results should not include any learn links
    # Disclaimer
    And the disclaimer should be shown
