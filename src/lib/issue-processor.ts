import mustache from 'mustache'
import { SearchIssuesAndPullRequestsResponseData } from '@octokit/types'
import { SlashAssignToolkit } from '../'
import { getInputsFromTools } from './helpers'

export type Issue = SearchIssuesAndPullRequestsResponseData['items'][0] & {
  assignee: null | SearchIssuesAndPullRequestsResponseData['items'][0]['user']
}

export default class StaleAssignments {
  private assignmentDuration: number

  constructor (
    private tools: SlashAssignToolkit
  ) {
    this.assignmentDuration = (
      parseInt(this.tools.inputs.days_until_warning, 10) +
      parseInt(this.tools.inputs.days_until_unassign, 10)
    )
  }

  async getStaleAssignments (): Promise<Issue[]> {
    const assignedLabel = this.tools.inputs.assigned_label
    const exemptLabel = this.tools.inputs.pin_label
    const { owner, repo } = this.tools.context.repo

    const timestamp = this.since(this.assignmentDuration)
      .toISOString()
      .replace(/\.\d{3}\w$/, '')

    const q = [
      // Only get issues with the label that shows they've been assigned
      `label:"${assignedLabel}"`,
      // Don't include issues that can be stale
      `-label:"${exemptLabel}"`,
      // Only include issues, not PRs
      'is:issue',
      // Only search within this repository
      `repo:${owner}/${repo}`,
      // TODO: Only find issues/PRs with an assignee. Bug in search API.
      // 'assigned:*',
      // Only find opened issues/PRs
      'is:open',
      // Updated within the last X days
      `updated:<${timestamp}`
    ]

    const issues = await this.tools.github.search.issuesAndPullRequests({
      q: q.join(' '),
      sort: 'updated',
      order: 'desc',
      per_page: 100
    })

    return issues.data.items as Issue[]
  }

  hasWarningLabel (issue: Issue): boolean {
    return issue
      .labels
      .some(label => label.name === this.tools.inputs.stale_assignment_label)
  }

  async postWarningMessage (issue: Issue) {
    return Promise.all([
      this.tools.github.issues.createComment({
        ...this.tools.context.repo,
        issue_number: issue.number,
        body: mustache.render(this.tools.inputs.warning_comment, {
          assignee: issue.assignee,
          env: process.env,
          inputs: getInputsFromTools(this.tools)
        })
      }),
      this.tools.github.issues.addLabels({
        ...this.tools.context.repo,
        issue_number: issue.number,
        labels: [this.tools.inputs.stale_assignment_label]
      })
    ])
  }

  async unassignIssue (issue: Issue) {
    return Promise.all([
      this.tools.github.issues.removeAssignees({
        ...this.tools.context.repo,
        issue_number: issue.number,
        assignees: [issue.assignee.login]
      }),
      this.tools.github.issues.removeLabel({
        ...this.tools.context.repo,
        issue_number: issue.number,
        name: this.tools.inputs.stale_assignment_label
      })
    ])
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