import bcrypt from 'bcrypt';

const plaintextPassword = 'your_plaintext_password';
const hashedPassword = '$2b$10$E8c3ykNdlCxmK7JtQv4kkutrc9yphszoxr6HCOrh8ndvgxL2Uppvi';

bcrypt.compare(plaintextPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Password match:', result);
  }
});