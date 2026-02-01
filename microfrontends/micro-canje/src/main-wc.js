import { defineCustomElement } from 'vue'
import CarritoCanjes from './components/CarritoCanjes.vue'

const CarritoCanjesElement = defineCustomElement(CarritoCanjes)
customElements.define('micro-canje-producto', CarritoCanjesElement)
