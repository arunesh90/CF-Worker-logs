export default class functionTimer {
  beganAt: number

  constructor () {
    this.beganAt = Date.now()
  }

  duration () {
    return Date.now() - this.beganAt
  }
}
