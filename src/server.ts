import express, { json } from "express";
import { getDB } from "./db/index.js";
import { expenses } from "./db/schema.js";
import { router } from "./routes/index.js";
import cors from "cors";
const api = express();

api.use(
  cors({
    origin: "*",
  }),
);
api.use(json());

api.use("/api", router);

api.use("{*splat}", (req, res) => {
  res.status(404).send(`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bro get tf🫩</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #121212;
        color: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        font-size: clamp(2rem, 6vw, 5rem);
        font-weight: bold;
        text-align: center;
        user-select: none;
      }
    </style>
  </head>
  <body>
    bro...get tf🫩
  </body>
  </html>`);
});

api.listen(3000, () => {
  console.log("Server up and running");

  const db = getDB();
  db.select()
    .from(expenses)
    .limit(1)
    .then(() => {
      console.log("database seems to be working");
    })
    .catch((err) => {
      console.error("ok database is complaining", err);
    });
});
