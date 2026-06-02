import type { ProcurementAgentAPIResponse } from "./Types";
import {createContext, useContext, useEffect, useState} from "react";



interface AgentContextType{

    agentResponse : ProcurementAgentAPIResponse | null;
    loadingAgentResponse: boolean;
    getAgentResponse : (procurementDetails : string )=>Promise<void>;
    

}


const AgentContext = createContext<AgentContextType | null>(null);


export const AgentProvider = ({children} : {children: React.ReactNode}) => {

    const [agentResponse, setAgentResponse] = useState<ProcurementAgentAPIResponse | null>(()=>{
        const saved= localStorage.getItem('agentResponse');

        return saved ? JSON.parse(saved) : null;
    });


    useEffect(()=>{
        localStorage.setItem('agentResponse', JSON.stringify(agentResponse));
    }, [agentResponse]);

    const [loadingAgentResponse, setLoadingAgentResponse] = useState(false);

    const getAgentResponse = async (procurementDetails : string) => {

        setLoadingAgentResponse(true);

        try{

            const res = await fetch("http://localhost:5000/api/agent", {
                method : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                 body: JSON.stringify({
        message: procurementDetails
    })

            });

            const data = await res.json();

            if(!res.ok){
                throw new Error(data.error ||data.message || "Error in getting agent response");
            }

            console.log("agent data: ",data);
            setAgentResponse(data);

        } catch (error) {
            console.error("Error fetching agent response:", error);
        } finally {
            setLoadingAgentResponse(false);
        }
    }


    return  <AgentContext.Provider 
    value={{agentResponse, loadingAgentResponse, getAgentResponse}}>
        {children}
    </AgentContext.Provider>
}


export const useAgentContext = () => {

    const context = useContext(AgentContext);

    if(!context){
        throw new Error("useAgentContext must be used within an AgentProvider");
    }

    return context;
}