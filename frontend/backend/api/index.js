module.exports = (req, res) => {
  res.status(200).json({
    service: "ai-eventmang-backend",
    status: "ok",
    message: "Backend deployed on Vercel"
  });
};
