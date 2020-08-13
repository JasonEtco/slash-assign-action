import { Toolkit } from 'actions-toolkit'
import commentHandler from './comment-handler'
import scheduleHandler from './schedule-handler'

export interface Inputs {
  assigned_label: string
  required_label?: string
  pin_label?: string
  days_until_warning: string
  days_until_unassign: string
  stale_assignment_label: string
  [key: string]: string | undefined
}

export type SlashAssignToolkit = Toolkit<Inputs>

export default async function slashAssignAction(tools: SlashAssignToolkit) {
  switch (tools.context.event) {
    case 'issue_comment':
      commentHandler(tools)
      break
    case 'schedule':
      await scheduleHandler(tools)
      break
    default:
      throw new Error(`Unhandled event ${tools.context.event}`)
  }
}
