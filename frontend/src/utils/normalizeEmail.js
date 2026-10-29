function normalizeEmail(value) {
  const email = value.trim().toLowerCase();

  if (!email.includes('@')) {
    return `${email}@gmail.com`;
  }

  return email;
}

export default normalizeEmail;