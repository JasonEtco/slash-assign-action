import nock from 'nock'
import slashAssignAction, { SlashAssignToolkit } from '../src/lib'
import { generateToolkit } from './helpers'

describe('slash-assign-action', () => {
  let tools: SlashAssignToolkit

  beforeEach(() => {
    nock.cleanAll()
    tools = generateToolkit()
  })

  it('assigns the user to the issue', async () => {
    nock('https://api.github.com')
      .post('/repos/JasonEtco/testing/issues/1/assignees')
      .reply(200)

    await slashAssignAction(tools)

    expect(nock.isDone()).toBe(true)
  })
})
