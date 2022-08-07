/**
 * Controller State
 * 
 * Stores information about the current controller state, and its components.
 */
 
export const Interface = {
  Disconnected: 'none',
  /** The controller is connected over USB */
  USB: 'usb',
  /** The controller is connected over BT */
  Bluetooth: 'bt'
}

/**
 * Default / Initial State
 * @ignore
 */
export const defaultState = {
  interface: Interface.Disconnected,
  lightbar: { r: 0, g: 0, b: 64 },
  rumble: { light: 0, heavy: 0 },
  battery: 0,
  charging: false,

  axes: {
    leftStickX: 0,
    leftStickY: 0,
    rightStickX: 0,
    rightStickY: 0,

    l2: 0,
    r2: 0,

    accelX: 0,
    accelY: 0,
    accelZ: 0,

    gyroX: 0,
    gyroY: 0,
    gyroZ: 0
  },

  buttons: {
    triangle: false,
    circle: false,
    cross: false,
    square: false,

    dPadUp: false,
    dPadRight: false,
    dPadDown: false,
    dPadLeft: false,

    l1: false,
    l2: false,
    l3: false,

    r1: false,
    r2: false,
    r3: false,

    options: false,
    share: false,
    playStation: false,
    touchPadClick: false
  },

  touchpad: {
    touches: []
  },

  timestamp: -1
}
