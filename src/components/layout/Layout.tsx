import React from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#161616' }}>
      <Sidebar />
      <main style={{ flex: 1, height: '100vh', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

export default Layout
