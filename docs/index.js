import tag from "https://deno.land/x/tag@v0.2.0/mod.js";
import Demo from './Demo.js'

const data = {
  controllers: []
}

const $ = tag('#app', data)

$.render(Demo($))
