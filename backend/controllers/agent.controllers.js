import { runProcurementAgent } from "../agent/agent.js";


export const callAgent = async(req, res,next) => {

    try{

        const {message} = req.body;

        if(!message || message.trim() === ""){
            return res.status(400).json({
                success : false,
                message : "Message is required"
            });
        }

        const result = await runProcurementAgent(message);

        return res.status(200).json({
            success : true,
            data : result
        });
    }catch(err){
        next(err);
    }
}