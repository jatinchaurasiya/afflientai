import { supabase } from './supabase';

// Platform Integration Service - Handles all CMS platform connections
export class PlatformIntegrationService {
  private static instance: PlatformIntegrationService;
  private verifiedSites = new Map();
  private integrationScripts = new Map();

  static getInstance(): PlatformIntegrationService {
    if (!PlatformIntegrationService.instance) {
      PlatformIntegrationService.instance = new PlatformIntegrationService();
    }
    return PlatformIntegrationService.instance;
  }

  // Connect website from any CMS platform
  async connectWebsite(userId: string, websiteData: {
    domain: string;
    name?: string;
    platform: 'wordpress' | 'wix' | 'squarespace' | 'custom';
  }) {
    try {
      // Step 1: Validate domain and platform
      const validation = await this.validateWebsite(websiteData.domain, websiteData.platform);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 2: Generate platform-specific integration code
      const integrationKey = this.generateIntegrationKey();
      const integrationCode = this.generatePlatformSpecificCode(websiteData.platform, integrationKey, userId);

      // Step 3: Store website in database
      const { data: website, error } = await supabase
        .from('websites')
        .insert({
          user_id: userId,
          domain: websiteData.domain,
          name: websiteData.name,
          integration_key: integrationKey,
          status: 'pending',
          settings: {
            platform: websiteData.platform,
            integration_code: integrationCode
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Step 4: Set up real-time content monitoring
      await this.setupContentMonitoring(website.id, websiteData.domain);

      return {
        success: true,
        website,
        integrationCode,
        instructions: this.getPlatformInstructions(websiteData.platform)
      };

    } catch (error) {
      console.error('Website connection error:', error);
      throw error;
    }
  }

  // Generate platform-specific integration code
  private generatePlatformSpecificCode(platform: string, integrationKey: string, userId: string): string {
    const baseScript = `
<!-- Afflient.ai Integration Script -->
<script>
(function() {
  window.AfflientConfig = {
    integrationKey: '${integrationKey}',
    userId: '${userId}',
    platform: '${platform}',
    apiBase: '${window.location.origin}/api'
  };
  
  // Load main script
  var script = document.createElement('script');
  script.src = '${window.location.origin}/integration/afflient.js';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;

    switch (platform) {
      case 'wordpress':
        return `<?php
// Add to functions.php
function afflient_integration() {
    echo '${baseScript}';
}
add_action('wp_head', 'afflient_integration');
?>`;

      case 'wix':
        return `// Add to Velo Code (Page Code)
$w.onReady(function() {
    ${baseScript.replace('<script>', '').replace('</script>', '')}
});`;

      case 'squarespace':
        return `<!-- Add to Settings > Advanced > Code Injection > Header -->
${baseScript}`;

      default:
        return `<!-- Add before closing </head> tag -->
${baseScript}`;
    }
  }

  // Validate website and platform
  private async validateWebsite(domain: string, platform: string): Promise<{valid: boolean, error?: string}> {
    try {
      // Check if domain is accessible
      const response = await fetch(`https://${domain}`, { method: 'HEAD' });
      if (!response.ok) {
        return { valid: false, error: 'Domain not accessible' };
      }

      // Platform-specific validation
      switch (platform) {
        case 'wordpress':
          return await this.validateWordPress(domain);
        case 'wix':
          return await this.validateWix(domain);
        case 'squarespace':
          return await this.validateSquarespace(domain);
        default:
          return { valid: true };
      }
    } catch (error) {
      return { valid: false, error: 'Validation failed' };
    }
  }

  private async validateWordPress(domain: string): Promise<{valid: boolean, error?: string}> {
    try {
      const response = await fetch(`https://${domain}/wp-json/wp/v2/`);
      return { valid: response.ok };
    } catch {
      return { valid: true }; // Assume valid if API not accessible
    }
  }

  private async validateWix(domain: string): Promise<{valid: boolean, error?: string}> {
    // Wix sites typically have specific patterns
    return { valid: true };
  }

  private async validateSquarespace(domain: string): Promise<{valid: boolean, error?: string}> {
    // Squarespace sites have specific patterns
    return { valid: true };
  }

  // Set up real-time content monitoring
  private async setupContentMonitoring(websiteId: string, domain: string) {
    // This would set up webhooks or polling for new content
    console.log(`Setting up content monitoring for ${domain}`);
    
    // Store monitoring configuration
    await supabase
      .from('content_monitoring')
      .insert({
        website_id: websiteId,
        domain: domain,
        last_check: new Date().toISOString(),
        status: 'active'
      });
  }

  private generateIntegrationKey(): string {
    return 'afflient_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  private getPlatformInstructions(platform: string): string[] {
    const instructions = {
      wordpress: [
        'Go to WordPress Admin → Appearance → Theme Editor',
        'Select your active theme and open functions.php',
        'Add the provided code at the end of the file',
        'Save changes and verify the integration'
      ],
      wix: [
        'Open your Wix site editor',
        'Click on the Dev Mode icon',
        'Go to Page Code files',
        'Add the integration code to your main page'
      ],
      squarespace: [
        'Go to Settings → Advanced → Code Injection',
        'Paste the integration code in the Header section',
        'Save your changes',
        'Verify the integration'
      ],
      custom: [
        'Open your website\'s HTML file',
        'Add the integration code before the closing </head> tag',
        'Upload the changes to your server',
        'Verify the integration'
      ]
    };

    return instructions[platform] || instructions.custom;
  }

  // Verify website integration
  async verifyIntegration(websiteId: string): Promise<boolean> {
    try {
      const { data: website } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (!website) return false;

      // Check if integration script is properly loaded
      const response = await fetch(`https://${website.domain}`);
      const html = await response.text();
      
      const hasIntegration = html.includes(website.integration_key);
      
      if (hasIntegration) {
        await supabase
          .from('websites')
          .update({ status: 'active' })
          .eq('id', websiteId);
      }

      return hasIntegration;
    } catch (error) {
      console.error('Integration verification error:', error);
      return false;
    }
  }
}

export const platformIntegration = PlatformIntegrationService.getInstance();