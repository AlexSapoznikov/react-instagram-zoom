import React from 'react'
import Zoomable from 'react-instagram-zoom'

const App = () => {
  return (
    <div>
      {
        Array(5).fill(null).map(_ => (
          <div>Other content</div>
        ))
      }

      <Zoomable>
        <img src="/cat.png" width="80%" style={{ maxWidth: '400px' }}/>
      </Zoomable>

      {
        Array(10).fill(null).map(_ => (
          <div>Other content</div>
        ))
      }
    </div>
  )
}

export default App
