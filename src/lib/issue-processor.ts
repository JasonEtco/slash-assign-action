import { SlashAssignToolkit } from '.'
import { SearchIssuesAndPullRequestsResponseData } from '@octokit/types'

export type Issue = SearchIssuesAndPullRequestsResponseData['items'][0]

export default class StaleAssignments {
  constructor (
    private tools: SlashAssignToolkit
  ) {}

  static getQueryTypeRestriction (type: string) {
    if (type === 'pulls') {
      return 'is:pr'
    } else if (type === 'issues') {
      return 'is:issue'
    }
    throw new Error(`Unknown type: ${type}. Valid types are 'pulls' and 'issues'`)
  }

  async getStaleAssignments (type: string) {
    const assignedLabel = this.tools.inputs.mark_label
    const exemptLabel = this.tools.inputs.pin_label

    const queryParts = [
      `label:"${assignedLabel}"`,
      `-label:"${exemptLabel}"`,
      StaleAssignments.getQueryTypeRestriction(type)
    ]

    return this.search(queryParts)
  }

  async search (query: string[]) {
    const { owner, repo } = this.tools.context.repo
    const assignmentLength = parseInt(this.tools.inputs.days_until_warning, 10)
    const timestamp = this.since(assignmentLength)
      .toISOString()
      .replace(/\.\d{3}\w$/, '')

    const q = [
      // Only search within this repository
      `repo:${owner}/${repo}`,
      // Only find issues/PRs with an assignee
      'assigned:*',
      // Only find opened issues/PRs
      'is:open',
      // Updated within the last X days
      `updated:<${timestamp}`,
      // And our ending bits
      ...query
    ]

    const issues = await this.tools.github.search.issuesAndPullRequests({
      q: q.join(' '),
      sort: 'updated',
      order: 'desc',
      per_page: 100
    })

    return issues.data.items
  }

  async hasWarningLabel (issue: Issue): Promise<boolean> {
    return issue
      .labels
      .some(label => label.name === this.tools.inputs.stale_assignment_label)
  }

  async postWarningMessage (issue: Issue) {
    return Promise.all([
      this.tools.github.issues.createComment({
        ...this.tools.context.repo,
        issue_number: issue.number,
        body: 'This will become unassigned!'
      }),
      this.tools.github.issues.addLabels({
        ...this.tools.context.repo,
        issue_number: issue.number,
        labels: [this.tools.inputs.stale_assignment_label]
      }),
    ])
  }

  async unassignIssue (issue: Issue) {
    return this.tools.github.issues.removeAssignees({
      ...this.tools.context.repo,
      issue_number: issue.number,
      assignees: [issue.assignee]
    })
  }

  since (days: number) {
    const ttl = days * 24 * 60 * 60 * 1000
    let date = new Date(new Date() as any - ttl)

    // GitHub won't allow it
    if (date < new Date(0)) {
      date = new Date(0)
    }
    return date
  }
}