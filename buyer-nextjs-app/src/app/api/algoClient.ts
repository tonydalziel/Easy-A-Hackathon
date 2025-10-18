import algosdk from "algosdk";

<<<<<<< HEAD
const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
const server = process.env.NEXT_PUBLIC_ALGOD_SERVER || "http://localhost";
const port = parseInt(process.env.NEXT_PUBLIC_ALGOD_PORT || "4001", 10);
=======
const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; // Replace with your algod API token
const server = "http://localhost";
const port = 4002; // Default localnet port, change if needed
>>>>>>> c7ff951 (test)

export const client = new algosdk.Algodv2(token, server, port);
