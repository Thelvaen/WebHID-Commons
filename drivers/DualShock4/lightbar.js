import { hslToRgb } from './util/colorConversion.js'

/**
 * Stores and manages the lightbar state.
 */
export default class DualShock4Lightbar {
  /** @ignore */
  _r = 0
  /** @ignore */
  _g = 0
  /** @ignore */
  _b = 0

  /**
   * Send Lightbar data to the controller.
   * @ignore
   */
  updateLightbar () {
    if (!this.controller.device) {
      throw new Error('Controller not initialized. You must call .init() first!')
    }
    return this.controller.sendLocalState()
  }

  /** Red Color Intensity (0-255) */
  get r () {
    return this._r
  }

  set r (value) {
    this._r = Math.min(255, Math.max(0, value))
    this.updateLightbar()
  }

  /** Green Color Intensity (0-255) */
  get g () {
    return this._g
  }

  set g (value) {
    this._g = Math.min(255, Math.max(0, value))
    this.updateLightbar()
  }

  /** Blue Color Intensity (0-255) */
  get b () {
    return this._b
  }

  set b (value) {
    this._b = Math.min(255, Math.max(0, value))
    this.updateLightbar()
  }

  /**
   * Sets the lightbar color (RGB)
   * @param r - Red color intensity (0-255)
   * @param g - Green color intensity (0-255)
   * @param b - Blue color intensity (0-255)
   */
  setColorRGB (r, g, b) {
    this._r = Math.min(255, Math.max(0, r))
    this._g = Math.min(255, Math.max(0, g))
    this._b = Math.min(255, Math.max(0, b))
    return this.updateLightbar()
  }

  /**
   * Sets the lightbar color (HSL)
   * @param h - Hue
   * @param s - Saturation
   * @param l - Lightness
   */
  setColorHSL (h, s, l) {
    const color = hslToRgb(h, s, l)
    return this.setColorRGB(color.r, color.g, color.b)
  }
}
