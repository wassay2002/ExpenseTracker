import { useState, useCallback} from 'react'
import './App.css'

function App() {


 let [counter, setCounter] = useState(5)

 // let counter = 5;

  const addValue = ()=> {
    counter =  counter + 1 ;
    setCounter(counter )
  }

  const subtractValue = () => {
    if (counter > 0) {
    counter = counter - 1;
    setCounter(counter)
    }
    else {
      setCounter(counter = 0)
    }

  }

  return (
    <>
      <h1>Chai or React {counter}</h1>
      <h2>Counter value {counter} :</h2>

      <button
      onClick={addValue}
      >Add Value</button>
      <br />
      <button
      
      onClick={subtractValue}
      
      >remove value</button>
    </>
  )
}

export default App
