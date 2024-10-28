import { httpServer } from "./src/http_server/index";
import { config } from "dotenv";

config();

const HTTP_PORT = Number(process.env.HTTP_PORT) || 3001;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
