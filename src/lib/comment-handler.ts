import dedent from 'dedent'
import mustache from 'mustache'
import { SlashAssignToolkit } from '../'
import { Issue } from './issue-processor'

export default async function commentHandler (tools: SlashAssignToolkit) {
  return tools.command('assign', async () => {
    const issue = tools.context.payload.issue as Issue
    const comment = tools.context.payload.comment

    // Check if the issue has the configured label
    if (tools.inputs.required_label) {
      const hasLabel = issue.labels.some(
        (label: { name: string }) => label.name === tools.inputs.required_label
      )

      if (!hasLabel) {
        return tools.exit.failure(
          `Required label [${tools.inputs.required_label}] label not found in issue #${issue.number}.`
        )
      }
    }

    // Check if it has no assignees
    if (issue.assignee) {
      return tools.exit.failure(
        `Issue #${issue.number} is already assigned to @${issue.assignee}`
      )
    }

    // Assign the user
    await tools.github.issues.addAssignees({
      ...tools.context.issue,
      assignees: [comment.user.login]
    })

    // Label the issue
    await tools.github.issues.addLabels({
      ...tools.context.issue,
      labels: [tools.inputs.assigned_label]
    })

    const totalDays = (
      parseInt(tools.inputs.days_until_warning, 10) +
      parseInt(tools.inputs.days_until_unassign, 10)
    )

    const body = mustache.render(tools.inputs.assigned_comment, {
      totalDays,
      comment,
      env: process.env,
      // Have to explicitly get these, because `tools.inputs` is a Proxy`
      inputs: {
        assigned_label: tools.inputs.assigned_label,
        required_label: tools.inputs.required_label,
        pin_label: tools.inputs.pin_label,
        days_until_warning: tools.inputs.days_until_warning,
        days_until_unassign: tools.inputs.days_until_unassign,
        stale_assignment_label: tools.inputs.stale_assignment_label,
        assigned_comment: tools.inputs.assigned_comment,
      }
    })

    // Comment saying wassup
    await tools.github.issues.createComment({
      ...tools.context.issue,
      body
    })
  })
}