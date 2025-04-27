import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Card from './components/card'

function App() {
  const [count, setCount] = useState(0)
  let myObj= {
    name: 'hitech',
    age:25
  }

  return (
    <>
    <h1 className='bg-gray-400 p-4 rounded-xl'>This is props test</h1>
<div className=''>
    <Card name=" abdul wassay" btnText= "clickMe"/>
    <Card name=" kashif" btnText= "clickMe"/>
</div>
    </>
  )
}

export default App
