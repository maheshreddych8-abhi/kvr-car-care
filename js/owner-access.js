// Switch the owner/staff login presentation without enabling unconfigured OTP delivery.
document.addEventListener('DOMContentLoaded', () => {
  const choices = document.querySelectorAll('.owner-role-choice');
  const ownerPanel = document.getElementById('owner-role-panel');
  const staffPanel = document.getElementById('staff-role-panel');

  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      const isStaff = choice.dataset.role === 'staff';

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

      ownerPanel.classList.toggle('hidden', isStaff);
      staffPanel.classList.toggle('hidden', !isStaff);
    });
  });
});
