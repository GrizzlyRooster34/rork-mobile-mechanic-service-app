import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import { prisma } from '../../../../lib/database';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['CUSTOMER', 'MECHANIC', 'ADMIN']).default('CUSTOMER'),
      profile: z.object({
        firstName: z.string(),
        lastName: z.string(),
        phone: z.string().optional(),
        // Customer specific fields
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        // Mechanic specific fields
        licenseNumber: z.string().optional(),
        certifications: z.array(z.string()).optional(),
        specialties: z.array(z.string()).optional(),
        experienceYears: z.number().optional(),
        hourlyRate: z.number().optional(),
        serviceRadius: z.number().optional(),
        availableTools: z.array(z.string()).optional(),
        // Admin specific fields
        permissions: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists',
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 12);

        // Create user and profile in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.user.create({
            data: {
              email: input.email,
              password: hashedPassword,
              role: input.role,
            },
          });

          // Create appropriate profile based on role
          let profile;
          if (input.role === 'CUSTOMER') {
            profile = await tx.customerProfile.create({
              data: {
                userId: user.id,
                firstName: input.profile.firstName,
                lastName: input.profile.lastName,
                phone: input.profile.phone,
                address: input.profile.address,
                city: input.profile.city,
                state: input.profile.state,
                zipCode: input.profile.zipCode,
              },
            });
          } else if (input.role === 'MECHANIC') {
            profile = await tx.mechanicProfile.create({
              data: {
                userId: user.id,
                firstName: input.profile.firstName,
                lastName: input.profile.lastName,
                phone: input.profile.phone || '',
                licenseNumber: input.profile.licenseNumber,
                certifications: input.profile.certifications || [],
                specialties: input.profile.specialties || [],
                experienceYears: input.profile.experienceYears,
                hourlyRate: input.profile.hourlyRate,
                serviceRadius: input.profile.serviceRadius || 25.0,
                availableTools: input.profile.availableTools || [],
              },
            });
          } else if (input.role === 'ADMIN') {
            profile = await tx.adminProfile.create({
              data: {
                userId: user.id,
                firstName: input.profile.firstName,
                lastName: input.profile.lastName,
                permissions: input.profile.permissions || [],
              },
            });
          }

          return { user, profile };
        });

        console.log('User registered:', input.email, input.role);
        return {
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          },
          profile: result.profile,
        };
      } catch (error) {
        console.error('Error registering user:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register user',
        });
      }
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Find user with profile
        const user = await prisma.user.findUnique({
          where: { email: input.email },
          include: {
            customerProfile: true,
            mechanicProfile: true,
            adminProfile: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        if (!user.isActive) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Account is deactivated',
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(input.password, user.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // Get the appropriate profile
        let profile;
        if (user.role === 'CUSTOMER') {
          profile = user.customerProfile;
        } else if (user.role === 'MECHANIC') {
          profile = user.mechanicProfile;
        } else if (user.role === 'ADMIN') {
          profile = user.adminProfile;
        }

        console.log('User logged in:', input.email);
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
          profile,
        };
      } catch (error) {
        console.error('Error logging in user:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to log in',
        });
      }
    }),

  getProfile: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
          include: {
            customerProfile: true,
            mechanicProfile: true,
            adminProfile: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        let profile;
        if (user.role === 'CUSTOMER') {
          profile = user.customerProfile;
        } else if (user.role === 'MECHANIC') {
          profile = user.mechanicProfile;
        } else if (user.role === 'ADMIN') {
          profile = user.adminProfile;
        }

        return {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
          profile,
        };
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch profile',
        });
      }
    }),

  updateProfile: publicProcedure
    .input(z.object({
      userId: z.string(),
      profile: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        // Customer fields
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        preferredContactMethod: z.string().optional(),
        notificationsEnabled: z.boolean().optional(),
        // Mechanic fields
        licenseNumber: z.string().optional(),
        certifications: z.array(z.string()).optional(),
        specialties: z.array(z.string()).optional(),
        experienceYears: z.number().optional(),
        hourlyRate: z.number().optional(),
        serviceRadius: z.number().optional(),
        currentLatitude: z.number().optional(),
        currentLongitude: z.number().optional(),
        isAvailable: z.boolean().optional(),
        availableTools: z.array(z.string()).optional(),
        vehicleYear: z.string().optional(),
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        // Admin fields
        permissions: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        let updatedProfile;
        const updateData = Object.fromEntries(
          Object.entries(input.profile).filter(([_, value]) => value !== undefined)
        );

        if (user.role === 'CUSTOMER') {
          updatedProfile = await prisma.customerProfile.update({
            where: { userId: input.userId },
            data: updateData,
          });
        } else if (user.role === 'MECHANIC') {
          updatedProfile = await prisma.mechanicProfile.update({
            where: { userId: input.userId },
            data: updateData,
          });
        } else if (user.role === 'ADMIN') {
          updatedProfile = await prisma.adminProfile.update({
            where: { userId: input.userId },
            data: updateData,
          });
        }

        console.log('Profile updated:', input.userId);
        return { success: true, profile: updatedProfile };
      } catch (error) {
        console.error('Error updating profile:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  changePassword: publicProcedure
    .input(z.object({
      userId: z.string(),
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(input.currentPassword, user.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(input.newPassword, 12);

        // Update password
        await prisma.user.update({
          where: { id: input.userId },
          data: { password: hashedNewPassword },
        });

        console.log('Password changed for user:', input.userId);
        return { success: true };
      } catch (error) {
        console.error('Error changing password:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
      }
    }),

  deactivateUser: publicProcedure
    .input(z.object({
      userId: z.string(),
      adminId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Verify admin permissions
        const admin = await prisma.user.findUnique({
          where: { id: input.adminId },
        });

        if (!admin || admin.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Insufficient permissions',
          });
        }

        // Deactivate user
        const user = await prisma.user.update({
          where: { id: input.userId },
          data: { isActive: false },
        });

        console.log('User deactivated:', input.userId);
        return { success: true, user };
      } catch (error) {
        console.error('Error deactivating user:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to deactivate user',
        });
      }
    }),

  getAllUsers: publicProcedure
    .input(z.object({
      adminId: z.string(),
      role: z.enum(['CUSTOMER', 'MECHANIC', 'ADMIN']).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      try {
        // Verify admin permissions
        const admin = await prisma.user.findUnique({
          where: { id: input.adminId },
        });

        if (!admin || admin.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Insufficient permissions',
          });
        }

        const where: any = {};
        if (input.role) where.role = input.role;
        if (input.isActive !== undefined) where.isActive = input.isActive;

        const users = await prisma.user.findMany({
          where,
          include: {
            customerProfile: true,
            mechanicProfile: true,
            adminProfile: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return { users };
      } catch (error) {
        console.error('Error fetching users:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
        });
      }
    }),
});