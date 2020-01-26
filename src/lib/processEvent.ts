import { parseURL as realURL } from 'whatwg-url'
import { CloudflareLog } from './types/CloudflareLog'
import functionTimer from './utils/functionTimer'
import { workerID, workerStartedAt, batchedLogs } from '../main'

const processEvent: (event: FetchEvent) => Promise<Response> = async (event) => {
  const { request } = event
  const { cf }      = request
  const clonedReq   = request.clone()
  const reqHeaders  = clonedReq.headers

  const resTimer  = new functionTimer()
  const response  = await fetch(event.request)
  const resTiming = resTimer.duration()

  const resHeaders = response.headers

  // Create log
  const requestURL = realURL(request.url)!
  const cloudflareLog: CloudflareLog = {
    timestamp: new Date(),
    user: {
      ip       : reqHeaders.get('cf-connecting-ip')!,
      country  : cf ? cf.country : undefined,
      userAgent: reqHeaders.get('user-agent')!
    },
    request: {
      path         : `/${requestURL.path.join('/')}`,
      host         : reqHeaders.get('host')!,
      method       : request.method,
      contentLength: Number(reqHeaders.get('content-length')),
      bodyLength   : (await clonedReq.text()).length,
      origin       : reqHeaders.get('origin') || undefined,
      referrer     : reqHeaders.get('referrer') || undefined
    },
    response: {
      responseTime : resTiming,
      statusCode   : response.status,
      contentLength: Number(resHeaders.get('content-length')),
      bodyLength   : (await response.clone().text()).length,
    },
    cache: {
      cf  : resHeaders.get('cf-cache-status') || undefined,
      zeit: resHeaders.get('x-now-cache') || undefined
    },
    worker: {
      id       : workerID,
      startedAt: workerStartedAt
    }
  }
 
  batchedLogs.push(cloudflareLog)
  return response
}

export default processEvent
