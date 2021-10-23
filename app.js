import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import tasks from "./tasks";
// import logger from "logger";
// const express = require("express");
// const path = require("path");
// const cookieParser = require("cookie-parser");
// const logger = require("morgan");
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

// app.get("/", function (req, res, next) {
//   res.render("index", { title: "Express" });
// });

router.get("/check-in", tasks.checkIn);
router.post("/invert-image", tasks.invert);

app.use("/tasks", router);
const port = process.env.PORT || 3000 
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});

export default app;
