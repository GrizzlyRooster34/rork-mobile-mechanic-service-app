import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import { prisma } from '../../../../lib/database';
import { TRPCError } from '@trpc/server';

export const jobRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      customerId: z.string(),
      vehicleId: z.string(),
      serviceType: z.string(),
      description: z.string(),
      urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('LOW'),
      location: z.object({
        address: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
      scheduledDate: z.date().optional(),
      customerNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // First create the service request
        const serviceRequest = await prisma.serviceRequest.create({
          data: {
            customerId: input.customerId,
            vehicleId: input.vehicleId,
            serviceType: input.serviceType,
            description: input.description,
            urgency: input.urgency,
            serviceLocation: input.location.address,
            latitude: input.location.latitude,
            longitude: input.location.longitude,
            requestedDate: input.scheduledDate,
            customerNotes: input.customerNotes,
            status: 'PENDING',
          },
          include: {
            customer: {
              include: {
                customerProfile: true,
              },
            },
            vehicle: true,
          },
        });

        return { 
          success: true, 
          serviceRequest,
          message: 'Service request created successfully'
        };
      } catch (error) {
        console.error('Error creating service request:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create service request',
        });
      }
    }),

  assign: publicProcedure
    .input(z.object({
      serviceRequestId: z.string(),
      mechanicId: z.string(),
      quoteId: z.string().optional(),
      priority: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.create({
          data: {
            serviceRequestId: input.serviceRequestId,
            mechanicId: input.mechanicId,
            quoteId: input.quoteId,
            priority: input.priority,
            status: 'ASSIGNED',
          },
          include: {
            serviceRequest: {
              include: {
                customer: {
                  include: {
                    customerProfile: true,
                  },
                },
                vehicle: true,
              },
            },
            mechanic: {
              include: {
                mechanicProfile: true,
              },
            },
          },
        });

        // Update service request status
        await prisma.serviceRequest.update({
          where: { id: input.serviceRequestId },
          data: { status: 'SCHEDULED' },
        });

        return { success: true, job };
      } catch (error) {
        console.error('Error assigning job:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign job',
        });
      }
    }),

  getAll: publicProcedure
    .input(z.object({
      mechanicId: z.string().optional(),
      customerId: z.string().optional(),
      status: z.enum(['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_PARTS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED']).optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        const where: any = {};
        
        if (input?.mechanicId) {
          where.mechanicId = input.mechanicId;
        }
        
        if (input?.customerId) {
          where.serviceRequest = {
            customerId: input.customerId,
          };
        }
        
        if (input?.status) {
          where.status = input.status;
        }

        const jobs = await prisma.job.findMany({
          where,
          include: {
            serviceRequest: {
              include: {
                customer: {
                  include: {
                    customerProfile: true,
                  },
                },
                vehicle: true,
                quotes: true,
              },
            },
            mechanic: {
              include: {
                mechanicProfile: true,
              },
            },
            timeLogs: true,
            photos: true,
            payments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return { jobs };
      } catch (error) {
        console.error('Error fetching jobs:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch jobs',
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
          include: {
            serviceRequest: {
              include: {
                customer: {
                  include: {
                    customerProfile: true,
                  },
                },
                vehicle: true,
                quotes: true,
              },
            },
            mechanic: {
              include: {
                mechanicProfile: true,
              },
            },
            timeLogs: {
              orderBy: {
                startTime: 'desc',
              },
            },
            photos: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            payments: true,
            maintenanceRecord: true,
          },
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        return { job };
      } catch (error) {
        console.error('Error fetching job:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch job',
        });
      }
    }),

  updateStatus: publicProcedure
    .input(z.object({
      jobId: z.string(),
      status: z.enum(['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_PARTS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const updateData: any = {
          status: input.status,
        };

        // Set timestamps based on status
        if (input.status === 'IN_PROGRESS' && !await prisma.job.findFirst({
          where: { id: input.jobId, startedAt: { not: null } }
        })) {
          updateData.startedAt = new Date();
        }

        if (input.status === 'COMPLETED') {
          updateData.completedAt = new Date();
        }

        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: updateData,
          include: {
            serviceRequest: {
              include: {
                customer: {
                  include: {
                    customerProfile: true,
                  },
                },
                vehicle: true,
              },
            },
            mechanic: {
              include: {
                mechanicProfile: true,
              },
            },
          },
        });

        // Update service request status accordingly
        let serviceRequestStatus = job.serviceRequest.status;
        if (input.status === 'IN_PROGRESS') {
          serviceRequestStatus = 'IN_PROGRESS';
        } else if (input.status === 'COMPLETED') {
          serviceRequestStatus = 'COMPLETED';
        } else if (input.status === 'CANCELLED') {
          serviceRequestStatus = 'CANCELLED';
        }

        await prisma.serviceRequest.update({
          where: { id: job.serviceRequestId },
          data: { status: serviceRequestStatus },
        });

        console.log('Job status updated:', input.jobId, input.status);
        return { success: true, job };
      } catch (error) {
        console.error('Error updating job status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update job status',
        });
      }
    }),

  startWork: publicProcedure
    .input(z.object({
      jobId: z.string(),
      mechanicId: z.string(),
      activity: z.string().default('Started work'),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Create time log entry
        const timeLog = await prisma.timeLog.create({
          data: {
            jobId: input.jobId,
            mechanicId: input.mechanicId,
            startTime: new Date(),
            activity: input.activity,
            latitude: input.latitude,
            longitude: input.longitude,
          },
        });

        // Update job status if needed
        await prisma.job.update({
          where: { id: input.jobId },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
          },
        });

        console.log('Work started for job:', input.jobId);
        return { success: true, timeLog };
      } catch (error) {
        console.error('Error starting work:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start work',
        });
      }
    }),

  stopWork: publicProcedure
    .input(z.object({
      timeLogId: z.string(),
      activity: z.string().default('Stopped work'),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const timeLog = await prisma.timeLog.findUnique({
          where: { id: input.timeLogId },
        });

        if (!timeLog) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Time log entry not found',
          });
        }

        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - timeLog.startTime.getTime()) / 1000 / 60); // minutes

        const updatedTimeLog = await prisma.timeLog.update({
          where: { id: input.timeLogId },
          data: {
            endTime,
            duration,
            activity: input.activity,
            description: input.description,
          },
        });

        console.log('Work stopped for time log:', input.timeLogId, `Duration: ${duration} minutes`);
        return { success: true, timeLog: updatedTimeLog };
      } catch (error) {
        console.error('Error stopping work:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to stop work',
        });
      }
    }),

  addPhoto: publicProcedure
    .input(z.object({
      jobId: z.string(),
      serviceRequestId: z.string().optional(),
      photoUrl: z.string(),
      filename: z.string(),
      photoType: z.enum(['BEFORE', 'DURING', 'AFTER', 'PARTS', 'DAMAGE', 'DIAGNOSTIC', 'OTHER']),
      description: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const photo = await prisma.photo.create({
          data: {
            jobId: input.jobId,
            serviceRequestId: input.serviceRequestId,
            filename: input.filename,
            url: input.photoUrl,
            photoType: input.photoType,
            description: input.description,
            latitude: input.latitude,
            longitude: input.longitude,
          },
        });

        console.log('Photo added to job:', input.jobId);
        return { success: true, photo };
      } catch (error) {
        console.error('Error adding photo:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add photo',
        });
      }
    }),

  completeJob: publicProcedure
    .input(z.object({
      jobId: z.string(),
      workPerformed: z.string(),
      partsUsed: z.array(z.object({
        name: z.string(),
        partNumber: z.string().optional(),
        quantity: z.number(),
        cost: z.number(),
      })).optional(),
      laborHours: z.number(),
      completionNotes: z.string().optional(),
      warrantyInfo: z.string().optional(),
      customerSatisfaction: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            workPerformed: input.workPerformed,
            partsUsed: input.partsUsed,
            laborHours: input.laborHours,
            completionNotes: input.completionNotes,
            warrantyInfo: input.warrantyInfo,
            customerSatisfaction: input.customerSatisfaction,
          },
          include: {
            serviceRequest: {
              include: {
                vehicle: true,
              },
            },
          },
        });

        // Update service request status
        await prisma.serviceRequest.update({
          where: { id: job.serviceRequestId },
          data: { status: 'COMPLETED' },
        });

        // Create maintenance record
        if (input.partsUsed && input.partsUsed.length > 0) {
          await prisma.maintenanceRecord.create({
            data: {
              vehicleId: job.serviceRequest.vehicleId,
              jobId: job.id,
              serviceType: job.serviceRequest.serviceType,
              description: input.workPerformed,
              mileageAtService: job.serviceRequest.vehicle.mileage,
              partsReplaced: input.partsUsed,
              laborTime: input.laborHours,
              totalCost: input.partsUsed.reduce((sum, part) => sum + (part.cost * part.quantity), 0),
              warrantyInfo: input.warrantyInfo,
            },
          });
        }

        console.log('Job completed:', input.jobId);
        return { success: true, job };
      } catch (error) {
        console.error('Error completing job:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete job',
        });
      }
    }),
});