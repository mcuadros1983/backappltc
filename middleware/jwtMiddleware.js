import jwt from "jsonwebtoken";

const JWTAuth = (req, res, next) => {

  const token = req.cookies.jwtToken;
  try {
    if (!token) {
      res.clearCookie("jwtToken", {
        httpOnly: true,
        domain: "localhost",
        path: "/",
      });
      res.status(302).json({ message:"Usuario no autorizado" });
    } else {

      const user = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

      req.user = user;
      next();
    }
  } catch (err) {
    res.clearCookie("jwtToken", {
      httpOnly: true,
      domain: "localhost",
      path: "/",
    });
    res.status(302).json({ redirect: "/" });
  }
};

export default JWTAuth;
