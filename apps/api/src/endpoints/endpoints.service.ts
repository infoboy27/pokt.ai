import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PathService } from './path.service';
import * as crypto from 'crypto';

@Injectable()
export class EndpointsService {
  constructor(
    private prisma: PrismaService,
    private pathService: PathService,
  ) {}

  async createEndpoint(data: {
    orgId: string;
    name: string;
    chainId: string;
    rateLimit: number;
  }) {
    try {
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Create endpoint in PATH/Shannon
      const pathEndpoint = await this.pathService.provisionEndpoint({
        orgId: data.orgId,
        chainId: data.chainId,
        rateLimit: data.rateLimit,
        label: data.name,
      });

      // Store in database
      const endpoint = await this.prisma.endpoint.create({
        data: {
          orgId: data.orgId,
          name: data.name,
          baseUrl: pathEndpoint.endpointUrl,
          healthUrl: `${pathEndpoint.endpointUrl}/health`,
          description: `Endpoint for ${data.name}`,
          isActive: true,
        },
      });

      return {
        ...endpoint,
        endpointUrl: pathEndpoint.endpointUrl,
        token, // Only returned once
      };
    } catch (error) {
      console.error('Error creating endpoint:', error);
      throw error;
    }
  }

  async getEndpoints(orgId: string) {
    console.log('Getting endpoints for orgId:', orgId);
    const endpoints = await this.prisma.endpoint.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Found endpoints:', endpoints.length);

    // Format endpoints for frontend
    const formattedEndpoints = endpoints.map(endpoint => ({
      id: endpoint.id,
      name: endpoint.name,
      chainId: 'F00A', // Default chain ID
      endpointUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
      rpcUrl: `https://pokt.ai/api/rpc/${endpoint.id}`,
      token: `pokt_${endpoint.id.substring(0, 12)}`,
      rateLimit: 1000, // Default rate limit
      status: endpoint.isActive ? 'active' : 'inactive',
      createdAt: endpoint.createdAt,
      billing: {
        totalRelays: 0,
        monthlyRelays: 0,
        estimatedMonthlyCost: 0,
        estimatedMonthlyCostDollars: 0,
      },
    }));

    return {
      endpoints: formattedEndpoints,
      summary: {
        totalEndpoints: formattedEndpoints.length,
        totalRelays: 0,
        monthlyRelays: 0,
        estimatedMonthlyCost: 0,
        estimatedMonthlyCostDollars: 0,
      },
      billing: {
        currentMonth: new Date().toISOString().substring(0, 7),
        costPerRelay: 0.0001,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  async getEndpoint(id: string, orgId: string) {
    const endpoint = await this.prisma.endpoint.findFirst({
      where: { id, orgId },
    });

    if (!endpoint) {
      throw new NotFoundException('Endpoint not found');
    }

    return endpoint;
  }

  async rotateToken(id: string, orgId: string) {
    const endpoint = await this.getEndpoint(id, orgId);
    
    // Generate new token
    const newToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newToken).digest('hex');

    // Update in PATH/Shannon
    await this.pathService.rotateToken(id);

    // Update in database (store token hash in a separate table if needed)
    // For now, we'll just update the description to indicate token was rotated
    await this.prisma.endpoint.update({
      where: { id },
      data: { 
        description: `Endpoint for ${endpoint.name} (token rotated)`,
        updatedAt: new Date(),
      },
    });

    return { token: newToken }; // Only returned once
  }

  async revokeEndpoint(id: string, orgId: string) {
    const endpoint = await this.getEndpoint(id, orgId);

    // Revoke in PATH/Shannon
    await this.pathService.revokeEndpoint(id);

    // Update status in database
    await this.prisma.endpoint.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Endpoint revoked successfully' };
  }

  async deleteEndpoint(id: string, orgId: string) {
    const endpoint = await this.getEndpoint(id, orgId);

    // Revoke in PATH/Shannon
    await this.pathService.revokeEndpoint(id);

    // Delete from database
    await this.prisma.endpoint.delete({
      where: { id },
    });

    return { message: 'Endpoint deleted successfully' };
  }
}
