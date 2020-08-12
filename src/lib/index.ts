import { Toolkit } from 'actions-toolkit'
import commentHandler from './comment-handler'
import scheduleHandler from './schedule-handler'

export interface Inputs {
  mark_label: string
  assignment_length: string
  required_label?: string
  pin_label?: string
  [key: string]: string
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
