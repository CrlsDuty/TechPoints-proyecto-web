import React from 'react'
import { ProductosProvider } from './context/ProductosContext'
import CatalogoProductos from './components/CatalogoProductos'

function App() {
  return (
    <ProductosProvider>
      <div style={styles.app}>
        <CatalogoProductos />
      </div>
    </ProductosProvider>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  }
}

export default App
