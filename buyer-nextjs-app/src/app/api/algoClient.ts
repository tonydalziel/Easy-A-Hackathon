import algosdk from "algosdk";

const token = "API_KEY"; // Replace with your algod API token
const server = "http://localhost";
const port = 4001; // Default localnet port, change if needed

export const client = new algosdk.Algodv2(token, server, port);