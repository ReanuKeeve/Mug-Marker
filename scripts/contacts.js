document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');

  // Use ONE email consistently:
  const TO_EMAIL = 'info@mugmarker.ink';

  const byId = (id) => document.getElementById(id);

  function value(id) {
    return (byId(id)?.value || '').trim();
  }

  function validEmail(s) {
    return /^\S+@\S+\.\S+$/.test(s);
  }

  function buildMailto() {
    const name = value('name');
    const email = value('email');
    const subject = value('subject');
    const message = value('message');

    const finalSubject = subject || 'Website contact';
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      message
    ].join('\\n');

    return `mailto:${encodeURIComponent(TO_EMAIL)}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(body)}`;
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = value('name');
    const email = value('email');
    const subject = value('subject');
    const message = value('message');

    if (!name || !email || !subject || !message) {
      alert('Please fill in all fields.');
      return;
    }
    if (!validEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    window.location.href = buildMailto();
  });
});
