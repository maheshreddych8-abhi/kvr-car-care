document.addEventListener('DOMContentLoaded', () => {
  const choices = document.querySelectorAll('.owner-role-choice');
  const ownerPanel = document.getElementById('owner-role-panel');
  const staffPanel = document.getElementById('staff-role-panel');
  const status = document.getElementById('owner-auth-status');
  let selectedRole = 'owner';
  const pendingEmails = { owner: '', staff: '' };

  const showStatus = (message, isError = false, isNotice = false) => {
    status.textContent = message;
    status.classList.remove('hidden');
    status.classList.remove(
      'border-rose-500/50', 'bg-rose-950/60', 'text-rose-200',
      'border-amber-400/30', 'bg-amber-400/10', 'text-amber-100',
      'border-slate-700', 'bg-slate-800', 'text-slate-200'
    );
    const statusClasses = isError
      ? ['border-rose-500/50', 'bg-rose-950/60', 'text-rose-200']
      : isNotice
        ? ['border-slate-700', 'bg-slate-800', 'text-slate-200']
        : ['border-amber-400/30', 'bg-amber-400/10', 'text-amber-100'];
    status.classList.add(...statusClasses);
  };

  const openWorkshop = (user, role, staffMember = null) => {
    window.kvrSecureAuth = {
      role,
      email: user.email,
      isOwnerSession: () => role === 'owner',
      isWorkshopSession: () => role === 'owner' || role === 'staff'
    };
    window.kvrDB.setOwnerSession({
      name: staffMember?.full_name || user.user_metadata?.full_name || user.email,
      email: user.email,
      phone: staffMember?.mobile || '',
      role: role === 'owner' ? 'Owner' : 'Staff',
      authUserId: user.id,
      authMethod: 'email-otp',
      isLoggedIn: true
    });
    document.body.classList.remove('owner-auth-locked');
    document.getElementById('owner-auth-gate').remove();
    window.kvrOwner = new KVROwnerApp();
  };

  const checkExistingSession = async () => {
    try {
      const user = await window.kvrEmailAuth.getCurrentUser('workshop');
      if (!user?.email) return;
      if (user.email.toLowerCase() === window.kvrEmailAuth.ownerEmail) {
        openWorkshop(user, 'owner');
        return;
      }
      const staffMember = await window.kvrEmailAuth.isApprovedStaff(user.email.toLowerCase());
      if (staffMember) {
        openWorkshop(user, 'staff', staffMember);
        return;
      }
      await window.kvrEmailAuth.signOut('workshop');
      showStatus('This email is not approved for Owner or Staff access. Ask the owner to add your email first.', true);
    } catch (error) {
      showStatus(`Could not check the current sign-in: ${error.message}`, true);
    }
  };

  const requestOtp = async (role) => {
    const input = document.getElementById(role === 'owner' ? 'owner-login-email' : 'staff-login-email');
    const email = input.value.trim().toLowerCase();
    if (!input.checkValidity() || !email) {
      showStatus('Enter a valid email address.', true);
      input.focus();
      return;
    }
    if (role === 'owner' && email !== window.kvrEmailAuth.ownerEmail) {
      showStatus('Owner login is restricted to the registered owner email.', true);
      return;
    }

    const button = document.getElementById(`btn-${role}-send-otp`);
    button.disabled = true;
    button.textContent = 'Sending email OTP…';
    try {
      await window.kvrEmailAuth.sendOtp(email, role === 'staff', 'workshop');
      pendingEmails[role] = email;
      document.getElementById(`${role}-otp-entry`).classList.remove('hidden');
      showStatus(`Email OTP requested for ${email}. Check the inbox and spam folder for the 6-digit code.`, false);
    } catch (error) {
      const message = error.message.includes('Email OTP is not configured')
        ? 'Email sign-in is being set up. Please contact KVR Car Care.'
        : `Could not send email OTP: ${error.message}`;
      showStatus(message, !error.message.includes('Email OTP is not configured'), error.message.includes('Email OTP is not configured'));
    } finally {
      button.disabled = false;
      button.textContent = 'Resend OTP to email';
    }
  };

  const verifyOtp = async (role) => {
    const email = pendingEmails[role];
    const code = document.getElementById(`${role}-login-otp`).value.trim();
    if (!email) {
      showStatus('Request an email code before verifying.', true);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      showStatus('Enter the 6-digit code sent to your email.', true);
      return;
    }

    const button = document.getElementById(`btn-${role}-verify-otp`);
    button.disabled = true;
    button.textContent = 'Verifying…';
    let authenticated = false;
    try {
      const user = await window.kvrEmailAuth.verifyOtp(email, code, 'workshop');
      authenticated = true;
      if (role === 'owner') {
        if (user.email?.toLowerCase() !== window.kvrEmailAuth.ownerEmail) {
          throw new Error('The verified address is not the registered owner email.');
        }
        openWorkshop(user, 'owner');
        return;
      }

      const staffMember = await window.kvrEmailAuth.isApprovedStaff(email);
      if (!staffMember) {
        await window.kvrEmailAuth.signOut('workshop');
        authenticated = false;
        throw new Error('This email is not on the owner-approved staff list.');
      }
      openWorkshop(user, 'staff', staffMember);
    } catch (error) {
      if (authenticated) {
        await window.kvrEmailAuth.signOut('workshop');
      }
      showStatus(`Email sign-in failed: ${error.message}`, true);
    } finally {
      button.disabled = false;
      button.textContent = 'Verify OTP & Sign In';
    }
  };

  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      selectedRole = choice.dataset.role;
      choices.forEach((item) => {
        const selected = item === choice;
        item.setAttribute('aria-pressed', String(selected));
        item.classList.toggle('border-amber-400', selected);
        item.classList.toggle('bg-amber-400/15', selected);
        item.classList.toggle('text-amber-200', selected);
        item.classList.toggle('border-slate-700', !selected);
        item.classList.toggle('bg-slate-950/60', !selected);
        item.classList.toggle('text-slate-300', !selected);
      });
      ownerPanel.classList.toggle('hidden', selectedRole !== 'owner');
      staffPanel.classList.toggle('hidden', selectedRole !== 'staff');
    });
  });

  document.getElementById('btn-owner-send-otp').addEventListener('click', () => requestOtp('owner'));
  document.getElementById('btn-staff-send-otp').addEventListener('click', () => requestOtp('staff'));
  document.getElementById('btn-owner-verify-otp').addEventListener('click', () => verifyOtp('owner'));
  document.getElementById('btn-staff-verify-otp').addEventListener('click', () => verifyOtp('staff'));
  document.getElementById('btn-owner-logout').addEventListener('click', async () => {
    try {
      await window.kvrEmailAuth.signOut('workshop');
      window.kvrDB.clearOwnerSession();
      window.location.reload();
    } catch (error) {
      window.alert(`Could not sign out: ${error.message}`);
    }
  });

  checkExistingSession();
});
