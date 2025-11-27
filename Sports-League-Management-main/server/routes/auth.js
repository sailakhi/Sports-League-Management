import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// --------------------
// Register user
// --------------------
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role = "player" } = req.body;

    // Check if user already exists in your 'users' table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res
        .status(400)
        .json({ error: authError?.message || "Failed to create auth user" });
    }

    // Insert user profile into 'users' table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ id: authData.user.id, name, email, role }])
      .select()
      .single();

    if (userError) {
      console.error("User profile creation error:", userError);
      return res.status(400).json({ error: "Failed to create user profile" });
    }

    res.status(201).json({
      message: "User registered successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --------------------
// Login user
// --------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res
        .status(400)
        .json({ error: error?.message || "Invalid credentials" });
    }

    // Get user profile from 'users' table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", data.user.id)
      .single();

    if (userError || !userData) {
      return res.status(400).json({ error: "User profile not found" });
    }

    res.json({
      message: "Login successful",
      user: userData,
      session: data.session,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
