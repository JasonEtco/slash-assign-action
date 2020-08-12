import { Toolkit } from 'actions-toolkit'
import { Signale } from 'signale'
import { Inputs } from '../src/lib'

export function generateToolkit() {
  const tools = new Toolkit<Inputs>({
    logger: new Signale({ disabled: true })
  })
 
  return tools
}
