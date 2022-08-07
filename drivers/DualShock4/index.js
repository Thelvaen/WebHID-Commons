import { defaultState } from './state.js'
import DualShock4Lightbar from './lightbar.js'
import DualShock4Rumble from './rumble.js'
import { normalizeThumbstick, normalizeTrigger } from './util/normalize.js'
import { Buffer } from 'https://esm.sh/buffer'
import { crc32 } from 'https://esm.sh/crc'

 
const Interface = {
  Disconnected: 'none',
  /** The controller is connected over USB */
  USB: 'usb',
  /** The controller is connected over BT */
  Bluetooth: 'bt'
}

/**
 * Main class.
 */
export class DualShock4 {
  /** Internal WebHID device */
  device

  /** Raw contents of the last HID Report sent by the controller. */
  lastReport
  /** Raw contents of the last HID Report sent to the controller. */
  lastSentReport

  /** Current controller state */
  state = defaultState

  /** Allows lightbar control */
  lightbar = new DualShock4Lightbar(this)
  /** Allows rumble control */
  rumble = new DualShock4Rumble(this)

  constructor ($) {
    this.$ = $
    if (!navigator.hid || !navigator.hid.requestDevice) {
      throw new Error('WebHID not supported by browser or not available.')
    }
  }

  /**
   * Initializes the WebHID API and requests access to the device.
   * 
   * This function must be called in the context of user interaction
   * (i.e in a click event handler), otherwise it might not work.
   */
  async init () {
    if (this.device && this.device.opened) return

    const devices = await navigator.hid.requestDevice({
      // TODO: Add more compatible controllers?
      filters: [
        // Official Sony Controllers
        { vendorId: 0x054C, productId: 0x0BA0 },
        { vendorId: 0x054C, productId: 0x05C4 },
        { vendorId: 0x054C, productId: 0x09CC },
        { vendorId: 0x054C, productId: 0x05C5 },
        // Razer Raiju
        { vendorId: 0x1532, productId: 0x1000 },
        { vendorId: 0x1532, productId: 0x1007 },
        { vendorId: 0x1532, productId: 0x1004 },
        { vendorId: 0x1532, productId: 0x1009 },
        // Nacon Revol
        { vendorId: 0x146B, productId: 0x0D01 },
        { vendorId: 0x146B, productId: 0x0D02 },
        { vendorId: 0x146B, productId: 0x0D08 },
        // Other third party controllers
        { vendorId: 0x0F0D, productId: 0x00EE },
        { vendorId: 0x7545, productId: 0x0104 },
        { vendorId: 0x2E95, productId: 0x7725 },
        { vendorId: 0x11C0, productId: 0x4001 },
        { vendorId: 0x0C12, productId: 0x57AB },
        { vendorId: 0x0C12, productId: 0x0E16 },
        { vendorId: 0x0F0D, productId: 0x0084 }
      ]
    })

    this.device = devices[0]

    await this.device.open()

    this.device.oninputreport = (e) => requestAnimationFrame(this.processControllerReport(e))
  }

  /**
   * Parses a report sent from the controller and updates the state.
   * 
   * This function is called internally by the library each time a report is received.
   * 
   * @param report - HID Report sent by the controller.
   */
   processControllerReport (report) {
    const { data } = report
    this.lastReport = data.buffer

    // Interface is unknown
    if (this.state.interface === Interface.Disconnected) {
      if (data.byteLength === 63) {
        this.state.interface = Interface.USB
      } else {
        this.state.interface = Interface.Bluetooth
        this.device.receiveFeatureReport(0x02)
        return
      }
      // Player 1 Color
      this.lightbar.setColorRGB(0, 0, 64).catch(e => console.error(e))
    }

    this.state.timestamp = report.timeStamp

    // USB Reports
    if (this.state.interface === Interface.USB && report.reportId === 0x01) {
      this.updateState(data)
    }
    // Bluetooth Reports
    if (this.state.interface === Interface.Bluetooth && report.reportId === 0x11) {
      this.updateState(new DataView(data.buffer, 2))
      this.device.receiveFeatureReport(0x02)
    }
  }

  /**
   * Updates the controller state using normalized data from the last report.
   * 
   * This function is called internally by the library each time a report is received.
   * 
   * @param data - Normalized data from the HID report.
   */
  updateState (data) {
    const state = {
      ...defaultState
    }

    // Update thumbsticks
    state.axes.leftStickX = normalizeThumbstick(data.getUint8(0))
    state.axes.leftStickY = normalizeThumbstick(data.getUint8(1))
    state.axes.rightStickX = normalizeThumbstick(data.getUint8(2))
    state.axes.rightStickY = normalizeThumbstick(data.getUint8(3))

    // Update main buttons
    const buttons1 = data.getUint8(4)
    state.buttons.triangle = !!(buttons1 & 0x80)
    state.buttons.circle = !!(buttons1 & 0x40)
    state.buttons.cross = !!(buttons1 & 0x20)
    state.buttons.square = !!(buttons1 & 0x10)
    // Update D-Pad
    const dPad = buttons1 & 0x0F
    state.buttons.dPadUp = dPad === 7 || dPad === 0 || dPad === 1
    state.buttons.dPadRight = dPad === 1 || dPad === 2 || dPad === 3
    state.buttons.dPadDown = dPad === 3 || dPad === 4 || dPad === 5
    state.buttons.dPadLeft = dPad === 5 || dPad === 6 || dPad === 7
    // Update additional buttons
    const buttons2 = data.getUint8(5)
    state.buttons.l1 = !!(buttons2 & 0x01)
    state.buttons.r1 = !!(buttons2 & 0x02)
    state.buttons.l2 = !!(buttons2 & 0x04)
    state.buttons.r2 = !!(buttons2 & 0x08)
    state.buttons.share = !!(buttons2 & 0x10)
    state.buttons.options = !!(buttons2 & 0x20)
    state.buttons.l3 = !!(buttons2 & 0x40)
    state.buttons.r3 = !!(buttons2 & 0x80)
    const buttons3 = data.getUint8(6)
    state.buttons.playStation = !!(buttons3 & 0x01)
    state.buttons.touchPadClick = !!(buttons3 & 0x02)

    // Update Triggers
    state.axes.l2 = normalizeTrigger(data.getUint8(7))
    state.axes.r2 = normalizeTrigger(data.getUint8(8))

    // Update battery level
    state.charging = !!(data.getUint8(29) & 0x10)
    if (state.charging) {
      state.battery = Math.min(Math.floor((data.getUint8(29) & 0x0F) * 100 / 11))
    } else {
      state.battery = Math.min(100, Math.floor((data.getUint8(29) & 0x0F) * 100 / 8))
    }
    
    // Update motion input
    state.axes.gyroX = data.getUint16(13)
    state.axes.gyroY = data.getUint16(15)
    state.axes.gyroZ = data.getUint16(17)
    state.axes.accelX = data.getInt16(19)
    state.axes.accelY = data.getInt16(21)
    state.axes.accelZ = data.getInt16(23)

    // Update touchpad
    state.touchpad.touches = []
    if (!(data.getUint8(34) & 0x80)) {
      state.touchpad.touches.push({
        touchId: data.getUint8(34) & 0x7F,
        x: (data.getUint8(36) & 0x0F) << 8 | data.getUint8(35),
        y: data.getUint8(37) << 4 | (data.getUint8(36) & 0xF0) >> 4
      })
    }
    if (!(data.getUint8(38) & 0x80)) {
      state.touchpad.touches.push({
        touchId: data.getUint8(38) & 0x7F,
        x: (data.getUint8(40) & 0x0F) << 8 | data.getUint8(39),
        y: data.getUint8(41) << 4 | (data.getUint8(40) & 0xF0) >> 4
      })
    }

    this.$.write({ controllers: [state] })
  }

  /**
   * Sends the local rumble and lightbar state to the controller.
   * 
   * This function is called automatically in most cases.
   * 
   * **Currently broken over Bluetooth, doesn't do anything**
   */
  sendLocalState () {
    if (!this.device) throw new Error('Controller not initialized. You must call .init() first!')

    if (this.state.interface === Interface.USB) {
      const report = new Uint8Array(16)

      // Report ID
      report[0] = 0x05

      // Enable Rumble (0x01), Lightbar (0x02)
      report[1] = 0xF0 | 0x01 | 0x02

      // Light rumble motor
      report[4] = this.rumble.light
      // Heavy rumble motor
      report[5] = this.rumble.heavy

      // Lightbar Red
      report[6] = this.lightbar.r
      // Lightbar Green
      report[7] = this.lightbar.g
      // Lightbar Blue
      report[8] = this.lightbar.b

      this.lastSentReport = report.buffer

      return this.device.sendReport(report[0], report.slice(1))
    } else {
      const report = new Uint16Array(79)
      const crcBytes = new Uint8Array(4)
      const crcDv = new DataView(crcBytes.buffer)

      // Header
      report[0] = 0xA2
      // Report ID
      report[1] = 0x11

      // Poll Rate
      report[2] = 0x80
      // Enable rumble and lights
      report[4] = 0xFF

      // Light rumble motor
      report[7] = this.rumble.light
      // Heavy rumble motor
      report[8] = this.rumble.heavy

      // Lightbar Red
      report[9] = this.lightbar.r
      // Lightbar Green
      report[10] = this.lightbar.g
      // Lightbar Blue
      report[11] = this.lightbar.b

      crcDv.setUint32(0, crc32(Buffer.from(report.slice(0, 75))))
      report[75] = crcBytes[3]
      report[76] = crcBytes[2]
      report[77] = crcBytes[1]
      report[78] = crcBytes[0]
      
      this.lastSentReport = report.buffer

      return this.device.sendReport(report[1], report.slice(2))
    }
  }
}
