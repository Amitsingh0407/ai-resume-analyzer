import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { dbService } from "../db.js";
import { generateToken, authenticateToken, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register user with secure password hash
 */
router.post("/register", async (req: any, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Please enter all required fields (name, email, password)" });
    return;
  }

  try {
    const existingUser = await dbService.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "A user with that email address already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await dbService.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken({ id: newUser.id, email: newUser.email });

    res.status(201).json({
      message: "Registration completed successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.error("User registration issue:", error);
    res.status(500).json({ error: "Server registration failure. Try again later." });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user, match passwords, issue token
 */
router.post("/login", async (req: any, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Please provide both email and password." });
    return;
  }

  try {
    const user = await dbService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid login credentials." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid login credentials." });
      return;
    }

    const token = generateToken({ id: user.id || user._id, email: user.email });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("User login issue:", error);
    res.status(500).json({ error: "Server login error. Try again later." });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get authenticated user profile details
 */
router.get("/profile", authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized access context." });
      return;
    }

    const user = await dbService.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User detail lookup failed." });
      return;
    }

    res.status(200).json({
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      dbMode: dbService.getDbMode(),
    });
  } catch (error) {
    console.error("Fetching profile context error:", error);
    res.status(500).json({ error: "Server error executing profile fetch." });
  }
});

export default router;
