
export function generateStrongPassword(passwordLength: number = 12): string {
    if (passwordLength < 8) {
        throw new Error("Password length should be at least 8 characters.");
      }
    
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lower = "abcdefghijklmnopqrstuvwxyz";
      const digits = "0123456789";
      const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";
    
      const allChars = upper + lower + digits + symbols;
    
      // Ensure at least one character from each category
      const getRandomChar = (chars: string) =>
        chars[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32) * chars.length)];
    
      const requiredChars = [
        getRandomChar(upper),
        getRandomChar(lower),
        getRandomChar(digits),
        getRandomChar(symbols),
      ];
    
      // Fill the rest of the password
      const remainingLength = passwordLength - requiredChars.length;
      const passwordChars = [...requiredChars];
    
      for (let i = 0; i < remainingLength; i++) {
        passwordChars.push(getRandomChar(allChars));
      }
    
      // Shuffle the result to avoid predictable placement
      for (let i = passwordChars.length - 1; i > 0; i--) {
        const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32) * (i + 1));
        [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
      }
    
      return passwordChars.join('');
    
  };