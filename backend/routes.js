import { Router } from 'express';
import {callAgent} from "./controllers/agent.controllers.js";

const agentRouter = Router();


agentRouter.post('/', callAgent);


export default agentRouter;