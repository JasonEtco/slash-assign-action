import { SlashAssignToolkit } from '../';
import StaleAssignments from './issue-processor'

export default async function scheduleHandler (tools: SlashAssignToolkit) {
  const processor = new StaleAssignments(tools)
  // Find all open issues with the assigned_label
  const issues = await processor.getStaleAssignments()

  for (const issue of issues) {
    // Ensure that the issue is assigned to someone
    if (!issue.assignee) continue
    // Check for the warning message
    const hasWarning = processor.hasWarningLabel(issue)
    if (!hasWarning) {
      // Post warning
      await processor.postWarningMessage(issue)
    } else {
      // Unassign the user
      await processor.unassignIssue(issue)
    }
  }
}
