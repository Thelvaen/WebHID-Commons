import { DualShock4 } from '../drivers/DualShock4/index.js'

function hidSupported () {
  return !!(window.navigator.hid && window.navigator.hid.requestDevice)
}

const scopedStyles = `
  & .buttons .btn {
    display: inline-block;
    background: #AAAAAA;
    margin: 4px;
    padding: 8px;
    transition: opacity 300ms ease
  }

  & .analogs .analog {
    display: inline-block;
    background: #AAAAAA;
    margin: 4px;
    padding: 8px;
    transition: opacity 300ms ease;
    min-width: 64px;
  }

  & .name {
    text-transform: capitalize;
  }
`

export default function Demo($) {
  $.on('click', '[data-click="join"]', () => new DualShock4($).init())
  $.style(scopedStyles)

  return (_target) => {
    const { controllers } = $.read()

    return `
      ${controllers.map((controller, i) => `
        <h2>
          Controller ${i} (${controller.interface.toUpperCase()},
          Battery: ${controller.battery}%
          ${controller.charging ? `[charging]` : ``})
        </h2>
        <div class="params">
          <h4>Lightbar Color</h4>
          <label>R: </label><input type="range" min="0" max="255" value="${controller.lightbar.r}"> (${controller.lightbar.r})<br>
          <label>G: </label><input type="range" min="0" max="255" value="${controller.lightbar.g}"> (${controller.lightbar.g})<br>
          <label>B: </label><input type="range" min="0" max="255" value="${controller.lightbar.b}"> (${controller.lightbar.b})
          <h4>Rumble</h4>
          <label>Weak: </label><input type="range" min="0" max="255" value="${controller.rumble.light}">  (${controller.rumble.light})<br>
          <label>Strong: </label><input type="range" min="0" max="255" value="${controller.rumble.heavy}">  (${controller.rumble.heavy})
        </div>
        <div class="buttons">
          <h3>Buttons</h3>
          ${Object.keys(controller.buttons).map((key) => {
            const button = controller.buttons[key]

            return `
              <div class="btn" style="opacity: ${button ? 1 : 0.5 }">
                <b class="name">${key}</b><br>
                ${button ? '1.00' : '0.00'}
              </div>
            `
          })}
        </div>
        <div class="analogs">
          <h3>Analogs</h3>
          ${Object.keys(controller.axes).map((key) => {
            const analog = controller.axes[key]
            return `
              <div class="analog" style="opacity: ${0.5 + Math.min(0.5, Math.abs(analog) * .5) }">
                <b class="name">${key}</b><br>
                ${analog.toFixed(2)}
              </div>
            `
          })}
        </div>
        <div class="touchpad">
          <h3>Touchpad</h3>
          ${!controller.touchpad.touches.length
            ? `No touches detected.`
            : controller.touchpad.touches.map(touch => `
              <div>
                <b>Touch ${touch.touchId}:</b> ${touch.x}, ${touch.y}
              </div>
            `).join('')
          }
        </div>
      `).join('')}
      ${
        hidSupported() ? `
          <button data-click="join">Connect Controller</button>
        ` : `
          Your browser doesn't seem to support WebHID yet.<br>
          If you are using Chrome, make sure to have at least version 78, and enable the
          <a href="chrome://flags/#enable-experimental-web-platform-features">experimental web platform features</a> flag.
        `
      }
    `
  }
}
