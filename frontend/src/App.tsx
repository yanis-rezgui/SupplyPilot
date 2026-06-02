import './App.css'
import Header from './Components/Header'
import Hero from './Components/Hero'
import HowItWorks from './Components/HowItWorks'
import { AgentProvider } from './Contexts/AgentContext'

function App() {
  

  return (
    <AgentProvider>
    <>

      <Header />
      <Hero/>
      <HowItWorks/>
     
    </>
    </AgentProvider>
  )
}

export default App
