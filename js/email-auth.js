class KVREmailAuth {
  constructor() {
    const config = window.KVR_SUPABASE_CONFIG;
    this.ownerEmail = (config?.ownerEmail || 'maheshch1810@gmail.com').trim().toLowerCase();
    this.clients = {};
    this.configurationError = 'Email OTP is not configured. Add the Supabase Project URL and public anon key in js/supabase-config.js.';

    if (config?.url && config?.anonKey && window.supabase?.createClient) {
      try {
        this.clients.customer = window.supabase.createClient(config.url, config.anonKey, {
          auth: { storageKey: 'kvr-customer-auth' }
        });
        this.clients.workshop = window.supabase.createClient(config.url, config.anonKey, {
          auth: { storageKey: 'kvr-workshop-auth' }
        });
        this.configurationError = '';
      } catch (error) {
        this.configurationError = `Supabase configuration is invalid: ${error.message}`;
      }
    } else if (config?.url && config?.anonKey && !window.supabase?.createClient) {
      this.configurationError = 'The authentication library did not load. Check the internet connection and reload.';
    }
  }

  requireClient(scope = 'customer') {
    if (!this.clients[scope]) {
      throw new Error(this.configurationError);
    }
    return this.clients[scope];
  }

  async sendOtp(email, shouldCreateUser = true, scope = 'customer', userMetadata = {}) {
    const client = this.requireClient(scope);
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser, data: userMetadata }
    });
    if (error) throw error;
  }

  async verifyOtp(email, token, scope = 'customer') {
    const client = this.requireClient(scope);
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Email code verification did not return an authenticated session.');
    }
    return data.user;
  }

  async getCurrentUser(scope = 'customer') {
    const client = this.clients[scope];
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async isApprovedStaff(email) {
    const client = this.requireClient('workshop');
    const { data, error } = await client
      .from('kvr_staff_members')
      .select('id, full_name, email, mobile')
      .eq('email', email)
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async listStaff() {
    const client = this.requireClient('workshop');
    const { data, error } = await client
      .from('kvr_staff_members')
      .select('id, full_name, email, mobile, active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addStaff(staff) {
    const client = this.requireClient('workshop');
    const { error } = await client.from('kvr_staff_members').insert(staff);
    if (error) throw error;
  }

  async setStaffActive(id, active) {
    const client = this.requireClient('workshop');
    const { error } = await client
      .from('kvr_staff_members')
      .update({ active })
      .eq('id', id);
    if (error) throw error;
  }

  async signOut(scope = 'customer') {
    const client = this.requireClient(scope);
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }
}

window.kvrEmailAuth = new KVREmailAuth();
