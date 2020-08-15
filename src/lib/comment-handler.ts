import dedent from 'dedent'
import mustache from 'mustache'
import { SlashAssignToolkit } from '../'
import { Issue } from './issue-processor'
import { getInputsFromTools } from './helpers'

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

    tools.log.info(`Assigning @${comment.user.login} to #${issue.number}`)

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
      inputs: getInputsFromTools(tools)
    })

    // Comment saying wassup
    await tools.github.issues.createComment({
      ...tools.context.issue,
      body
    })
  })
}