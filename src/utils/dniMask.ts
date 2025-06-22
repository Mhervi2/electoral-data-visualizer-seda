
/**
 * Masks a DNI by randomly replacing 5 digits with asterisks
 * @param dni - The full DNI string (e.g., "42220968Y")
 * @returns The masked DNI (e.g., "4***0**8Y")
 */
export const maskDniRandomly = (dni: string): string => {
  if (!dni || dni.length < 6) return dni;
  
  // Separate the number part from the letter part
  const dniNumber = dni.replace(/[A-Za-z]/g, '');
  const dniLetter = dni.replace(/[0-9]/g, '');
  
  if (dniNumber.length === 0) return dni;
  
  // Convert to array for easier manipulation
  const chars = dniNumber.split('');
  
  // If we have fewer than 5 digits, mask all of them
  const digitsToMask = Math.min(5, chars.length);
  
  // Create array of available positions to mask
  const availablePositions = chars.map((_, index) => index);
  
  // Randomly select positions to mask
  const positionsToMask: number[] = [];
  for (let i = 0; i < digitsToMask; i++) {
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const position = availablePositions.splice(randomIndex, 1)[0];
    positionsToMask.push(position);
  }
  
  // Apply masking
  positionsToMask.forEach(position => {
    chars[position] = '*';
  });
  
  // Reconstruct the DNI with the letter
  return chars.join('') + dniLetter;
};
