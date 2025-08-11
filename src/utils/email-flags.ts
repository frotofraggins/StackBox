/**
 * Email Stack Feature Flags
 * Per-tenant overrides with 60s caching
 */

interface EmailFlags {
  EMAIL_STACK_ENABLED: boolean;
  EMAIL_FORWARDING_ENABLED: boolean;
  EMAIL_MARKETING_ENABLED: boolean;
  EMAIL_AI_TEMPLATES_ENABLED: boolean;
}

interface TenantOverride {
  tenantId: string;
  flags: Partial<EmailFlags>;
  expiresAt: number;
}

class EmailFlagsService {
  private cache = new Map<string, TenantOverride>();
  private globalCache: { flags: EmailFlags; expiresAt: number } | null = null;
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds

  /**
   * Get default flags (all OFF for safety)
   */
  private getDefaultFlags(): EmailFlags {
    return {
      EMAIL_STACK_ENABLED: false,
      EMAIL_FORWARDING_ENABLED: false,
      EMAIL_MARKETING_ENABLED: false,
      EMAIL_AI_TEMPLATES_ENABLED: false,
    };
  }

  /**
   * Get global flags from environment
   */
  private getGlobalFlags(): EmailFlags {
    const now = Date.now();
    
    if (this.globalCache && this.globalCache.expiresAt > now) {
      return this.globalCache.flags;
    }

    const flags: EmailFlags = {
      EMAIL_STACK_ENABLED: process.env.EMAIL_STACK_ENABLED === 'true',
      EMAIL_FORWARDING_ENABLED: process.env.EMAIL_FORWARDING_ENABLED === 'true',
      EMAIL_MARKETING_ENABLED: process.env.EMAIL_MARKETING_ENABLED === 'true',
      EMAIL_AI_TEMPLATES_ENABLED: process.env.EMAIL_AI_TEMPLATES_ENABLED === 'true',
    };

    this.globalCache = {
      flags,
      expiresAt: now + this.CACHE_TTL
    };

    return flags;
  }

  /**
   * Get tenant-specific overrides (mock implementation)
   * In production, this would query a database
   */
  private getTenantOverrides(tenantId: string): Partial<EmailFlags> {
    const now = Date.now();
    const cached = this.cache.get(tenantId);
    
    if (cached && cached.expiresAt > now) {
      return cached.flags;
    }

    // Mock tenant overrides for development
    const mockOverrides: Record<string, Partial<EmailFlags>> = {
      't_demo': {
        EMAIL_STACK_ENABLED: true,
        EMAIL_FORWARDING_ENABLED: true,
      },
      't_test': {
        EMAIL_STACK_ENABLED: true,
        EMAIL_FORWARDING_ENABLED: true,
        EMAIL_MARKETING_ENABLED: true,
      },
      't_premium': {
        EMAIL_STACK_ENABLED: true,
        EMAIL_FORWARDING_ENABLED: true,
        EMAIL_MARKETING_ENABLED: true,
        EMAIL_AI_TEMPLATES_ENABLED: true,
      }
    };

    const overrides = mockOverrides[tenantId] || {};
    
    this.cache.set(tenantId, {
      tenantId,
      flags: overrides,
      expiresAt: now + this.CACHE_TTL
    });

    return overrides;
  }

  /**
   * Get merged flags for tenant (tenant → global → default)
   */
  getFlags(tenantId?: string): EmailFlags {
    const defaultFlags = this.getDefaultFlags();
    const globalFlags = this.getGlobalFlags();
    
    let mergedFlags = { ...defaultFlags, ...globalFlags };
    
    if (tenantId) {
      const tenantOverrides = this.getTenantOverrides(tenantId);
      mergedFlags = { ...mergedFlags, ...tenantOverrides };
    }

    return mergedFlags;
  }

  /**
   * Check if email stack is enabled for tenant
   */
  isEmailStackEnabled(tenantId?: string): boolean {
    return this.getFlags(tenantId).EMAIL_STACK_ENABLED;
  }

  /**
   * Check if forwarding is enabled for tenant
   */
  isForwardingEnabled(tenantId?: string): boolean {
    const flags = this.getFlags(tenantId);
    return flags.EMAIL_STACK_ENABLED && flags.EMAIL_FORWARDING_ENABLED;
  }

  /**
   * Check if marketing is enabled for tenant
   */
  isMarketingEnabled(tenantId?: string): boolean {
    const flags = this.getFlags(tenantId);
    return flags.EMAIL_STACK_ENABLED && flags.EMAIL_MARKETING_ENABLED;
  }

  /**
   * Check if AI templates are enabled for tenant
   */
  isAITemplatesEnabled(tenantId?: string): boolean {
    const flags = this.getFlags(tenantId);
    return flags.EMAIL_STACK_ENABLED && flags.EMAIL_AI_TEMPLATES_ENABLED;
  }

  /**
   * Get degraded response when features are disabled
   */
  getDegradedResponse(feature: string, tenantId?: string): {
    degraded: true;
    error: string;
    fallbackGuidance: string;
  } {
    const flags = this.getFlags(tenantId);
    
    return {
      degraded: true,
      error: `Email ${feature} is currently disabled`,
      fallbackGuidance: flags.EMAIL_STACK_ENABLED 
        ? `Feature '${feature}' not enabled for this tenant. Contact support to enable.`
        : 'Email stack is disabled. Set EMAIL_STACK_ENABLED=true to enable.'
    };
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.globalCache = null;
  }
}

// Singleton instance
const emailFlags = new EmailFlagsService();

// Export singleton and class for testing
export { emailFlags, EmailFlagsService };
export type { EmailFlags };
