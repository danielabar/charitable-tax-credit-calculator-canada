Feature: About page
  The About page shows information about the calculator
  and credits the team members who built it.

  Scenario: Direct URL access to About page
    When I visit "/about" directly
    Then I should see the About page content

  Scenario: About page renders all credits cards
    Given I am on the About page
    Then I should see the credits section
    And I should see 3 team member cards
    And each card should have a photo, name, role, and bio

  Scenario: Team member links point to correct URLs
    Given I am on the About page
    Then the "Daniela Baron" card should link to "danielabaron.me"
    And the "John Stapleton" card should link to "openpolicyontario.com"
    And the "MacGregor Goodman" card should link to "linkedin.com/in/macgregor-goodman"
