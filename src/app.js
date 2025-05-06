const express = require("express");
const dnsRoutes = require("./routes/dns");

const app = express();

app.use(express.json());
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./utils/swagger/swagger.json");

app.use("/api/dns", dnsRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;
