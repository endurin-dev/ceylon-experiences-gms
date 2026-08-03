import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const guestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string from the form
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  country: z.string().optional(),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  notes: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
