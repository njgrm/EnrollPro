import { Router } from "express";
import {
  login,
  me,
  changePassword,
  googleLogin,
  logout,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  loginSchema,
  changePasswordSchema,
  googleLoginSchema,
} from "@enrollpro/shared";
import { rateLimit } from "express-rate-limit";

const router: Router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts. Please try again later." },
});

const googleLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    message: "Too many Google login attempts. Please try again later.",
  },
});

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post(
  "/google",
  googleLoginLimiter,
  validate(googleLoginSchema),
  googleLogin,
);
router.post("/logout", logout);
router.get("/me", authenticate, me);
router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
