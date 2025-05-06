const Joi = require("joi");
const service = require("../services/dnsService");

const dnsSchema = Joi.object({
  type: Joi.string().valid("A", "AAAA", "CNAME", "MX", "TXT").required(),
  hostname: Joi.string().domain().required(),
  value: Joi.alternatives().conditional("type", {
    switch: [
      { is: "A", then: Joi.string().ip({ version: "ipv4" }).required() },
      { is: "AAAA", then: Joi.string().ip({ version: "ipv6" }).required() },
      { is: "CNAME", then: Joi.string().domain().required() },
      {
        is: "MX",
        then: Joi.object({
          priority: Joi.number().integer().min(0).required(),
          exchange: Joi.string().domain().required(),
        }).required(),
      },
      { is: "TXT", then: Joi.string().required() },
    ],
    otherwise: Joi.forbidden(),
  }),
  ttl: Joi.number().integer().positive().optional(),
});

exports.addRecord = async (req, res) => {
  const { error, value } = dnsSchema.validate(req.body);
  if (error) return res.status(422).json({ error: error.details[0].message });
  const response = await service.addRecord(value);
  res.status(response.status).json(response.data);
};

exports.resolveHostname = async (req, res) => {
  const { hostname } = req.params;
  const response = await service.resolveHostname(hostname);
  res.status(response.status).json(response.data);
};

exports.listRecords = async (req, res) => {
  const { hostname } = req.params;
  const response = await service.listRecords(hostname);
  res.status(response.status).json(response.data);
};

exports.deleteRecord = async (req, res) => {
  const { hostname } = req.params;
  const { type, value } = req.query;
  const response = await service.deleteRecord({ hostname, type, value });
  res.status(response.status).json(response.data);
};
