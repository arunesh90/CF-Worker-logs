import { CloudflareRequestInit } from 'types-cloudflare-worker'
import functionTimer from '../utils/functionTimer'

export interface searchOptions {
  index  : string,
  body?  : any,
  scroll?: string
  size?  : number
}

export interface scrollOptions {
  scroll_id: string,
  scroll   : string
}

export interface getByIdOptions {
  id   : string | number,
  index: string
}

class esClient {
  node         : string
  authUsername?: string
  authPassword?: string

  constructor (options: {node: string, authUsername?: string, authPassword?: string}) {
    this.node         = options.node
    this.authUsername = options.authUsername
    this.authPassword = options.authPassword
  }

  private async wrappedFetch (input: RequestInfo, fetchOptions?: RequestInit | CloudflareRequestInit) {
    let reqOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    }

    if (this.authUsername && this.authPassword) {
      (reqOptions.headers as any)['Authorization'] =  `Basic ${btoa(`${this.authUsername}:${this.authPassword}`)}`
    }

    return fetch(input, {
      ...fetchOptions,
      ...reqOptions
    })
  }

  async index (options: {index: string, doc: {[key: string]: any}}) {
    const res = await this.wrappedFetch(`${this.node}/${options.index}/_doc`, {
      method: 'POST',
      body  : JSON.stringify(options.doc)
    })

    return res
  }

  async bulkIndex (options: {index: string, docs: {[key: string]: any}[]}) {
    let payload = ''
    options.docs.forEach(doc => {
      payload += `{"index": {}\n`
      payload += `${JSON.stringify(doc)}\n`
    })

    const res = await this.wrappedFetch(`${this.node}/${options.index}/_bulk`, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/x-ndjson'
      }
    })

    return res
  }
  
  async getById<T = any> (options: getByIdOptions): Promise<T> {
    let jsonPayload: any;
    const res = await this.wrappedFetch(`${this.node}/${options.index}/_doc/${options.id}?preference=_local`)
    const resClone = res.clone()

    try {
      jsonPayload = await res.json()
    } catch (error) {
      throw new Error(`Failed (JSON) parsing a getById payload from ES: ${await resClone.text()}`)
    }

    return jsonPayload['_source']
  }

  async search (options: searchOptions) {
    let reqURL = new URL(`${this.node}/${options.index}/_search`)

    if (options.scroll) {
      reqURL.searchParams.append('scroll', options.scroll)
    } if (options.size) {
      reqURL.searchParams.append('size', String(options.size))
    }

    reqURL.searchParams.append('request_cache', 'true')
    reqURL.searchParams.append('preference', '_local')

    const beginTimer = new functionTimer()
    const res = await this.wrappedFetch(reqURL.href, {
      body  : JSON.stringify(options.body),
      method: 'POST'
    })
    console.log(beginTimer.duration(), JSON.stringify(options.body))

    return res.json()
  }

  async scroll (options: scrollOptions) {
    const res = await this.wrappedFetch(`${this.node}/_search/scroll`, {
      body  : JSON.stringify(options),
      method: 'POST'
    })

    return res.json()
  }
}

export default new esClient({
  node: process.env.ELASTIC_URL as string,
  authUsername: process.env.ELASTIC_USERNAME,
  authPassword: process.env.ELASTIC_PASSWORD
})
