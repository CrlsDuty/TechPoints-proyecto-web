import { describe, it, expect, vi } from 'vitest'
import eventBus from './eventBus'

describe('EventBus', () => {
  it('debe permitir suscribirse y emitir eventos', () => {
    const callback = vi.fn()
    
    eventBus.on('test-event', callback)
    eventBus.emit('test-event', { data: 'test' })
    
    expect(callback).toHaveBeenCalledWith({ data: 'test' })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('debe permitir múltiples suscriptores al mismo evento', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    
    eventBus.on('multi-event', callback1)
    eventBus.on('multi-event', callback2)
    eventBus.emit('multi-event', 'datos')
    
    expect(callback1).toHaveBeenCalledWith('datos')
    expect(callback2).toHaveBeenCalledWith('datos')
  })

  it('debe permitir desuscribirse de un evento', () => {
    const callback = vi.fn()
    
    const unsubscribe = eventBus.on('unsub-event', callback)
    eventBus.emit('unsub-event', 'primero')
    
    expect(callback).toHaveBeenCalledTimes(1)
    
    unsubscribe()
    eventBus.emit('unsub-event', 'segundo')
    
    expect(callback).toHaveBeenCalledTimes(1) // No debe llamarse de nuevo
  })

  it('debe ejecutar once() solo una vez', () => {
    const callback = vi.fn()
    
    eventBus.once('once-event', callback)
    eventBus.emit('once-event', 'primera')
    eventBus.emit('once-event', 'segunda')
    
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('primera')
  })

  it('no debe fallar si se emite un evento sin suscriptores', () => {
    expect(() => {
      eventBus.emit('no-subscribers', 'datos')
    }).not.toThrow()
  })

  it('debe permitir limpiar todos los eventos', () => {
    const callback = vi.fn()
    
    eventBus.on('clear-test', callback)
    eventBus.clear()
    eventBus.emit('clear-test', 'datos')
    
    expect(callback).not.toHaveBeenCalled()
  })
})
