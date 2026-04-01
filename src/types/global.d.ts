import { Env } from '@/interface/env'

declare global {
  /**
   * Mở rộng interface Window/global để chứa biến $env
   */
  var $env: Env
}
