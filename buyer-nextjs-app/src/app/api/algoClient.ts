import algosdk from "algosdk";

const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
const server = process.env.NEXT_PUBLIC_ALGOD_SERVER || "http://localhost";
const port = parseInt(process.env.NEXT_PUBLIC_ALGOD_PORT || "4001", 10);

export const client = new algosdk.Algodv2(token, server, port);