export interface CloudflareLog {
  timestamp: Date

  user: {
    ip       : string
    country? : string
    userAgent: string
  }
  request: {
    path          : string
    host          : string
    method        : string
    contentLength?: number
    bodyLength?   : number
    origin?       : string
    referrer?     : string
  }
  response: {
    responseTime  : number
    statusCode    : number
    contentLength?: number
    bodyLength?   : number
  }
  cache: {
    cf?  : string
    zeit?: string
  }
  worker: {
    id       : string
    startedAt: Date
  }
}
