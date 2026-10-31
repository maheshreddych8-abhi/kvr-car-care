class KVREmailAuth {
  constructor() {
    const config = window.KVR_SUPABASE_CONFIG;
    this.ownerEmail = (config?.ownerEmail || 'maheshch1810@gmail.com').trim().toLowerCase();
    this.clients = {};
    this.configurationError = 'Email OTP is not configured. Add the Supabase Project URL and public anon key in js/supabase-config.js.';

    if (config?.url && config?.anonKey && window.supabase?.createClient) {
      try {
        this.clients.customer = window.supabase.createClient(config.url, config.anonKey, {
          auth: {
            storageKey: 'kvr-customer-auth',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        });
        this.clients.workshop = window.supabase.createClient(config.url, config.anonKey, {
          auth: {
            storageKey: 'kvr-workshop-auth',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        });
        this.configurationError = '';

        // Auto-login on Magic Link callback for Customer
        this.clients.customer.auth.onAuthStateChange((event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
            const meta = session.user.user_metadata || {};
            const existingCust = window.kvrDB?.getCustomerSession() || {};
            window.kvrDB?.setCustomerSession({
              name: meta.full_name || existingCust.name || 'Valued Customer',
              phone: meta.phone || existingCust.phone || '9876543210',
              email: session.user.email,
              authUserId: session.user.id,
              authMethod: 'magic-link',
              isLoggedIn: true
            });
            if (typeof window.kvrSwitchView === 'function') {
              window.kvrSwitchView('customer');
            }
            if (window.kvrCustomer) {
              window.kvrCustomer.completeCustomerLogin(session.user, true);
            }
          }
        });

        // Auto-login on Magic Link callback for Workshop
        this.clients.workshop.auth.onAuthStateChange((event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
            const email = (session.user.email || '').trim().toLowerCase();
            const isOwner = email === this.ownerEmail;
            window.kvrDB?.setOwnerSession({
              name: isOwner ? 'Venkat Reddy (Owner)' : (session.user.user_metadata?.full_name || 'Staff Technician'),
              email: email,
              role: isOwner ? 'Owner' : 'Staff',
              isLoggedIn: true
            });
            if (typeof window.kvrSwitchView === 'function') {
              window.kvrSwitchView('owner');
            }
            if (typeof window.kvrOwnerCheckSession === 'function') {
              window.kvrOwnerCheckSession(session.user);
            }
          }
        });
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
    const appPath = scope === 'workshop' ? 'index.html?role=owner' : 'index.html?role=customer';
    
    let emailRedirectTo = `https://maheshreddych8-abhi.github.io/kvr-car-care/${appPath}`;
    if (typeof window !== 'undefined' && window.location?.origin) {
      if (window.location.origin.includes('github.io')) {
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        emailRedirectTo = `${window.location.origin}${basePath}${appPath}`;
      } else if (!window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        emailRedirectTo = `${window.location.origin}${basePath}${appPath}`;
      }
    }

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
        data: userMetadata,
        emailRedirectTo
      }
    });
    if (error) throw error;
  }

  async verifyOtp(email, token, scope = 'customer') {
    const client = this.requireClient(scope);
    const cleanToken = String(token || '').replace(/\D/g, '').trim();
    if (!cleanToken || cleanToken.length !== 6) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }
    const { data, error } = await client.auth.verifyOtp({
      email: (email || '').trim().toLowerCase(),
      token: cleanToken,
      type: 'email'
    });
    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Code verification did not return an authenticated session.');
    }
    return data.user;
  }

  async getCurrentUser(scope = 'customer') {
    const client = this.clients[scope];
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session?.user || null;
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
