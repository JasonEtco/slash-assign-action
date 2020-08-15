import { Toolkit } from 'actions-toolkit'
import { Signale } from 'signale'
import nock from 'nock'
import fs from 'fs'
import path from 'path'
import jsYaml from 'js-yaml'
import { Inputs } from '../src'

export function generateToolkit() {
  const tools = new Toolkit<Inputs>({
    logger: new Signale({ disabled: true })
  })

  // Mock the exit methods
  tools.exit.failure = jest.fn() as any
  tools.exit.success = jest.fn() as any
 
  return tools
}

export interface Endpoint {
  uri: string | RegExp
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  response: { status: number, body?: any}
}

export function recordNockRequests (endpoints: Endpoint[]) {
  const scopedNock = nock('https://api.github.com')
  const requests: Array<{ uri: string, params: any }> = []

  endpoints.forEach((endpoint, index) => {
    scopedNock[endpoint.method](endpoint.uri)
      .reply(endpoint.response.status, (uri, params) => {
        requests[index] = { uri, params }
        return endpoint.response.body
      })
  })

  return { scopedNock, requests }
}

/**
 * Helper that reads the `action.yml` and includes the default values
 * for each input as an environment variable, like the Actions runtime does.
 */
export function getDefaultValues() {
  const yaml = fs.readFileSync(path.join(__dirname, '../action.yml'), 'utf8')
  const { inputs } = jsYaml.safeLoad(yaml) as any

  return Object.keys(inputs).reduce((sum, key) => {
    if ('default' in inputs[key]) {
      return {
        ...sum,
        [`INPUT_${key.toUpperCase()}`]: inputs[key].default
      }
    } else {
      return sum
    }
  }, {})
}
