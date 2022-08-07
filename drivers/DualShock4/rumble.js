/**
 * Stores and manages the rumble state.
 */
export default class DualShock4Rumble {
  /** @ignore */
  _light = 0
  /** @ignore */
  _heavy = 0

  /**
   * Sends rumble data to the controller.
   * @ignore
   */
  updateRumble () {
    if (!this.controller.device) {
      throw new Error('Controller not initialized. You must call .init() first!')
    }
    return this.controller.sendLocalState()
  }

  /** Light Rumble Intensity (0-255) */
  get light () {
    return this._light
  }

  set light (value) {
    this._light = Math.max(0, Math.min(255, value))
    this.updateRumble()
  }

  /** Heavy Rumble Intensity (0-255) */
  get heavy () {
    return this._heavy
  }

  set heavy (value) {
    this._heavy = Math.max(0, Math.min(255, value))
    this.updateRumble()
  }

  /**
   * Set the rumble intensity
   * @param light - Light rumble intensity (0-255)
   * @param heavy - Heavy rumble intensity (0-255)
   */
  setRumbleIntensity (light, heavy) {
    this._light = Math.min(255, Math.max(0, light))
    this._heavy = Math.min(255, Math.max(0, heavy))
    return this.updateRumble()
  }
}
